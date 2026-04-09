import { useState, useEffect } from 'react'

const STORAGE_KEY = 'wpc-tournament-data'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const initialState = {
  players: [],
  matches: [],
  tournamentStarted: false,
  tournamentName: 'WPC Pickleball Tournament',
}

function generateBracket(players) {
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const matches = []
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      matches.push({
        id: crypto.randomUUID(),
        round: 1,
        player1: shuffled[i],
        player2: shuffled[i + 1],
        score1: 0,
        score2: 0,
        completed: false,
        winner: null,
      })
    } else {
      matches.push({
        id: crypto.randomUUID(),
        round: 1,
        player1: shuffled[i],
        player2: null,
        score1: 0,
        score2: 0,
        completed: true,
        winner: shuffled[i].id,
      })
    }
  }
  return matches
}

function generateNextRound(matches, currentRound) {
  const winners = matches
    .filter(m => m.round === currentRound && m.completed)
    .map(m => {
      if (m.player2 === null) return m.player1
      return m.winner === m.player1.id ? m.player1 : m.player2
    })

  if (winners.length <= 1) return []

  const next = []
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      next.push({
        id: crypto.randomUUID(),
        round: currentRound + 1,
        player1: winners[i],
        player2: winners[i + 1],
        score1: 0,
        score2: 0,
        completed: false,
        winner: null,
      })
    } else {
      next.push({
        id: crypto.randomUUID(),
        round: currentRound + 1,
        player1: winners[i],
        player2: null,
        score1: 0,
        score2: 0,
        completed: true,
        winner: winners[i].id,
      })
    }
  }
  return next
}

function PlayerForm({ onAdd }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({ id: crypto.randomUUID(), name: trimmed })
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Spieler Name eingeben..."
        style={styles.input}
      />
      <button type="submit" style={styles.btnPrimary}>+ Hinzufügen</button>
    </form>
  )
}

function PlayerList({ players, onRemove, disabled }) {
  if (players.length === 0) {
    return <p style={styles.muted}>Noch keine Spieler hinzugefügt.</p>
  }

  return (
    <div style={styles.playerList}>
      {players.map((p, i) => (
        <div key={p.id} style={styles.playerCard}>
          <span style={styles.playerIndex}>{i + 1}</span>
          <span style={styles.playerName}>{p.name}</span>
          {!disabled && (
            <button onClick={() => onRemove(p.id)} style={styles.btnRemove}>✕</button>
          )}
        </div>
      ))}
    </div>
  )
}

function MatchCard({ match, onUpdateScore, onComplete }) {
  if (!match.player2) {
    return (
      <div style={{ ...styles.matchCard, ...styles.matchBye }}>
        <div style={styles.matchHeader}>Freilos</div>
        <div style={styles.matchPlayers}>
          <span style={styles.winnerName}>{match.player1.name}</span>
          <span style={styles.byeLabel}>→ Weiter</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      ...styles.matchCard,
      ...(match.completed ? styles.matchCompleted : {})
    }}>
      <div style={styles.matchPlayers}>
        <div style={{
          ...styles.matchPlayer,
          ...(match.winner === match.player1.id ? styles.matchWinner : {})
        }}>
          <span>{match.player1.name}</span>
          {!match.completed ? (
            <div style={styles.scoreControls}>
              <button
                style={styles.btnScore}
                onClick={() => onUpdateScore(match.id, 'score1', Math.max(0, match.score1 - 1))}
              >−</button>
              <span style={styles.scoreValue}>{match.score1}</span>
              <button
                style={styles.btnScore}
                onClick={() => onUpdateScore(match.id, 'score1', match.score1 + 1)}
              >+</button>
            </div>
          ) : (
            <span style={styles.scoreFinal}>{match.score1}</span>
          )}
        </div>

        <span style={styles.vs}>VS</span>

        <div style={{
          ...styles.matchPlayer,
          ...(match.winner === match.player2.id ? styles.matchWinner : {})
        }}>
          <span>{match.player2.name}</span>
          {!match.completed ? (
            <div style={styles.scoreControls}>
              <button
                style={styles.btnScore}
                onClick={() => onUpdateScore(match.id, 'score2', Math.max(0, match.score2 - 1))}
              >−</button>
              <span style={styles.scoreValue}>{match.score2}</span>
              <button
                style={styles.btnScore}
                onClick={() => onUpdateScore(match.id, 'score2', match.score2 + 1)}
              >+</button>
            </div>
          ) : (
            <span style={styles.scoreFinal}>{match.score2}</span>
          )}
        </div>
      </div>

      {!match.completed && (
        <button
          style={styles.btnFinish}
          onClick={() => onComplete(match.id)}
          disabled={match.score1 === match.score2}
        >
          Spiel beenden
        </button>
      )}
      {match.completed && (
        <div style={styles.winnerBadge}>
          Gewinner: {match.winner === match.player1.id ? match.player1.name : match.player2.name}
        </div>
      )}
    </div>
  )
}

function App() {
  const [state, setState] = useState(() => loadData() || initialState)
  const [tab, setTab] = useState('players')

  useEffect(() => { saveData(state) }, [state])

  const addPlayer = (player) => {
    setState(s => ({ ...s, players: [...s.players, player] }))
  }

  const removePlayer = (id) => {
    setState(s => ({ ...s, players: s.players.filter(p => p.id !== id) }))
  }

  const startTournament = () => {
    if (state.players.length < 2) return
    const matches = generateBracket(state.players)
    setState(s => ({ ...s, matches, tournamentStarted: true }))
    setTab('bracket')
  }

  const resetTournament = () => {
    setState(s => ({ ...s, matches: [], tournamentStarted: false }))
  }

  const updateScore = (matchId, field, value) => {
    setState(s => ({
      ...s,
      matches: s.matches.map(m =>
        m.id === matchId ? { ...m, [field]: value } : m
      ),
    }))
  }

  const completeMatch = (matchId) => {
    setState(s => {
      const newMatches = s.matches.map(m => {
        if (m.id !== matchId) return m
        const winner = m.score1 > m.score2 ? m.player1.id : m.player2.id
        return { ...m, completed: true, winner }
      })

      const maxRound = Math.max(...newMatches.map(m => m.round))
      const currentRoundMatches = newMatches.filter(m => m.round === maxRound)
      const allComplete = currentRoundMatches.every(m => m.completed)

      if (allComplete && currentRoundMatches.length > 1) {
        const nextRound = generateNextRound(newMatches, maxRound)
        return { ...s, matches: [...newMatches, ...nextRound] }
      }

      return { ...s, matches: newMatches }
    })
  }

  const maxRound = state.matches.length > 0
    ? Math.max(...state.matches.map(m => m.round))
    : 0

  const finalMatch = state.matches.find(m => m.round === maxRound && m.completed && m.player2 !== null)
  const roundMatches = state.matches.filter(m => m.round === maxRound)
  const isTournamentOver = finalMatch && roundMatches.length === 1

  const champion = isTournamentOver
    ? (finalMatch.winner === finalMatch.player1.id ? finalMatch.player1 : finalMatch.player2)
    : null

  const rounds = []
  for (let r = 1; r <= maxRound; r++) {
    rounds.push({ round: r, matches: state.matches.filter(m => m.round === r) })
  }

  const roundLabel = (r, total) => {
    if (total === r && total > 1) return 'Finale'
    if (total === r + 1 && total > 2) return 'Halbfinale'
    return `Runde ${r}`
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>{state.tournamentName}</h1>
        <p style={styles.subtitle}>Pickleball Turnierverwaltung</p>
      </header>

      <nav style={styles.nav}>
        <button
          style={tab === 'players' ? styles.tabActive : styles.tab}
          onClick={() => setTab('players')}
        >
          Spieler ({state.players.length})
        </button>
        <button
          style={tab === 'bracket' ? styles.tabActive : styles.tab}
          onClick={() => setTab('bracket')}
        >
          Turnier-Bracket
        </button>
      </nav>

      <main style={styles.main}>
        {tab === 'players' && (
          <section>
            <div style={styles.sectionHeader}>
              <h2 style={styles.h2}>Spieler verwalten</h2>
              {state.players.length >= 2 && !state.tournamentStarted && (
                <button style={styles.btnStart} onClick={startTournament}>
                  Turnier starten
                </button>
              )}
              {state.tournamentStarted && (
                <button style={styles.btnDanger} onClick={resetTournament}>
                  Turnier zurücksetzen
                </button>
              )}
            </div>
            {!state.tournamentStarted && <PlayerForm onAdd={addPlayer} />}
            <PlayerList
              players={state.players}
              onRemove={removePlayer}
              disabled={state.tournamentStarted}
            />
          </section>
        )}

        {tab === 'bracket' && (
          <section>
            {!state.tournamentStarted ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyIcon}>🏓</p>
                <p style={styles.muted}>
                  Füge mindestens 2 Spieler hinzu und starte das Turnier.
                </p>
              </div>
            ) : (
              <>
                {champion && (
                  <div style={styles.champion}>
                    <div style={styles.trophy}>🏆</div>
                    <h2 style={styles.championTitle}>Turniersieger</h2>
                    <p style={styles.championName}>{champion.name}</p>
                  </div>
                )}

                <div style={styles.bracketScroll}>
                  <div style={styles.bracket}>
                    {rounds.map(({ round, matches }) => (
                      <div key={round} style={styles.roundColumn}>
                        <h3 style={styles.roundTitle}>
                          {roundLabel(round, maxRound)}
                        </h3>
                        <div style={styles.roundMatches}>
                          {matches.map(match => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              onUpdateScore={updateScore}
                              onComplete={completeMatch}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        WPC Pickleball Tournament Manager
      </footer>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    color: '#E2E8F0',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 20px',
  },
  header: {
    textAlign: 'center',
    padding: '40px 0 20px',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  nav: {
    display: 'flex',
    gap: 4,
    background: '#111827',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: '12px 20px',
    background: 'transparent',
    border: 'none',
    color: '#64748B',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 10,
    transition: 'all 0.2s',
  },
  tabActive: {
    flex: 1,
    padding: '12px 20px',
    background: '#1E293B',
    border: 'none',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 10,
  },
  main: {
    minHeight: 400,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  h2: {
    fontSize: 20,
    fontWeight: 600,
    color: '#F1F5F9',
  },
  form: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    background: '#111827',
    border: '1px solid #1E293B',
    borderRadius: 10,
    color: '#E2E8F0',
    fontSize: 14,
    outline: 'none',
  },
  btnPrimary: {
    padding: '12px 24px',
    background: '#3B82F6',
    border: 'none',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnStart: {
    padding: '10px 24px',
    background: '#10B981',
    border: 'none',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '10px 24px',
    background: '#EF4444',
    border: 'none',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 18px',
    background: '#111827',
    borderRadius: 10,
    border: '1px solid #1E293B',
  },
  playerIndex: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1E293B',
    borderRadius: '50%',
    fontSize: 12,
    fontWeight: 600,
    color: '#94A3B8',
    flexShrink: 0,
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 500,
  },
  btnRemove: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid #374151',
    borderRadius: '50%',
    color: '#EF4444',
    fontSize: 12,
    cursor: 'pointer',
  },
  muted: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    padding: 40,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  bracketScroll: {
    overflowX: 'auto',
    paddingBottom: 20,
  },
  bracket: {
    display: 'flex',
    gap: 24,
    minWidth: 'fit-content',
  },
  roundColumn: {
    minWidth: 300,
    flexShrink: 0,
  },
  roundTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  roundMatches: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  matchCard: {
    background: '#111827',
    borderRadius: 12,
    padding: 16,
    border: '1px solid #1E293B',
  },
  matchBye: {
    opacity: 0.6,
  },
  matchCompleted: {
    borderColor: '#10B981',
  },
  matchHeader: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  matchPlayers: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  matchPlayer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#0F172A',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  matchWinner: {
    background: '#064E3B',
    border: '1px solid #10B981',
  },
  vs: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    letterSpacing: 2,
  },
  scoreControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  btnScore: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1E293B',
    border: 'none',
    borderRadius: 6,
    color: '#E2E8F0',
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 700,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 700,
    minWidth: 24,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  scoreFinal: {
    fontSize: 18,
    fontWeight: 700,
    color: '#94A3B8',
  },
  btnFinish: {
    width: '100%',
    marginTop: 12,
    padding: '10px',
    background: '#3B82F6',
    border: 'none',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  winnerBadge: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#10B981',
  },
  byeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  winnerName: {
    fontWeight: 600,
    color: '#F1F5F9',
  },
  champion: {
    textAlign: 'center',
    padding: '32px 20px',
    marginBottom: 24,
    background: 'linear-gradient(135deg, #064E3B, #111827)',
    borderRadius: 16,
    border: '1px solid #10B981',
  },
  trophy: {
    fontSize: 56,
    marginBottom: 12,
  },
  championTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  championName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  footer: {
    textAlign: 'center',
    padding: '40px 0 24px',
    fontSize: 12,
    color: '#334155',
  },
}

export default App
