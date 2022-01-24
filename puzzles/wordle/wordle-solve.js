'use strict';

const e = React.createElement;

class WordleSolver extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        guesses: [[0, 0, 0, 0, 0]],
        bestWords: [GAME_TREE[0]['g']],
        treePositions: [0],
        finished: false,
        hardMode: false,
        ev: 3.40,
        wordSet: {},
    };

    this.submit = this.submit.bind(this)
    this.getGuessCode = this.getGuessCode.bind(this)
    this.treeInUse = this.treeInUse.bind(this)
    this.recomputeEVAndWordSet = this.recomputeEVAndWordSet.bind(this)
    this.computeEVRecurser = this.computeEVRecurser.bind(this)
  }

  componentDidMount() {
      this.recomputeEVAndWordSet(0);
  }

  click(row, column) {
      let { guesses, finished, bestWords, treePositions } = this.state
      if (row == guesses.length - 1 && finished) {
        return
      }
      if (row == guesses.length - 1) {
        guesses[row][column] = (guesses[row][column] + 1) % 3
        this.setState({ guesses })
        return
      }

      guesses[row][column] = (guesses[row][column] + 1) % 3
      guesses = guesses.slice(0, row + 1)
      bestWords = bestWords.slice(0, row + 1)
      treePositions = treePositions.slice(0, row + 1)
      this.setState({ guesses, bestWords, treePositions, finished: false })
      this.recomputeEVAndWordSet( treePositions[treePositions.length - 1] )
  }

  treeInUse = () => (this.state.hardMode ? GAME_TREE_HARD : GAME_TREE)

  recomputeEVAndWordSet = (n) => {
    let node = this.treeInUse()[n]
    if (Object.keys(node.r).length === 0) {
        return
    }

    let wordSet = {}
    let ev = this.computeEVRecurser(n, 0, "", wordSet, 0)
      
    this.setState({
        ev: ev / Object.values(wordSet).map(k => k.length).reduce((a, b) => a + b),
        wordSet: Object.fromEntries(Object.entries(wordSet).map(k => [k[0], k[1].sort()]))
    })
  }

  computeEVRecurser = (n, depth, lastWord, wordSet, resultClass) => {
      let node = this.treeInUse()[n]
      let resultsTable = node.r

      let totalWeight = 0
      let currentWordCount = Object.values(wordSet).map(k => k.length).reduce((a, b) => a + b, 0)
      if (depth == 0) {
        for (let k of Object.keys(resultsTable)) {
            wordSet[k] = []
        }
      }

      for (let k of Object.keys(resultsTable)) {
          let result = this.computeEVRecurser(resultsTable[k], depth + 1, node.g, wordSet, (depth == 0 ? k : resultClass))
          totalWeight += result
      }
      if (Object.keys(resultsTable).length == 0) {
          wordSet[resultClass].push(node.g)
          return (node.g == lastWord ? 0 : 1);
      }
      return totalWeight + (Object.values(wordSet).map(k => k.length).reduce((a, b) => a + b, 0) - currentWordCount)
  }

  getGuessCode = () => [...Array(5).keys()]
      .map(i => this.state.guesses[this.state.guesses.length - 1][i] * Math.pow(3, i))
      .reduce((a, b) => a + b)

  submit() {
      let { bestWords, guesses, treePositions, hardMode } = this.state

      let newTreePosition = this.treeInUse()[treePositions[treePositions.length - 1]]['r'][this.getGuessCode()]
      let finished = (Object.keys(this.treeInUse()[newTreePosition]['r']).length == 0)

      this.setState({
          treePositions: [...treePositions, newTreePosition],
          bestWords: [...bestWords, this.treeInUse()[newTreePosition]['g']],
          guesses: [...guesses, guesses[guesses.length - 1].map(g => (finished || (hardMode && g == 2) ? 2 : 0))],
          finished,
      })
      this.recomputeEVAndWordSet(newTreePosition)

    }

  buttonClass(mod) {
      return ['button-gray', 'button-yellow', 'button-green'][mod]
  }

  render() {
    let { bestWords, guesses, treePositions, finished, hardMode, ev, wordSet } = this.state
    let currentNode = this.treeInUse()[treePositions[treePositions.length - 1]]

    let MAX_ROWS_TO_DISPLAY = 10

    let renderResult = (result) => {
        let r = []
        for (let i = 0; i < 5; ++i) {
            var m = result % 3
            result = (result - m) / 3

            r.push(<div className={"result-square result-square-" + m}></div>)
        }

        return r
    }

    let renderRow = (result, possibilities) => (
        <div className="result-row">
            <div className="result-row-squares">
                {renderResult(result)}
            </div>
            <div className="result-row-words">
                <span className={possibilities.length == 1 ? "result-row-word-done" : undefined}>{possibilities[0]}</span>
                {possibilities.length > 1 ? <span>{"(+" + (possibilities.length - 1) + ")"}</span> : undefined}
            </div>
        </div>
    )

    return (<div style={{minHeight: '400px'}}>
        <div className="container">
            <div className="hard-mode">
                <span> hard mode </span>
                <input type="checkbox" value={hardMode} onChange={(e) => {
                    this.setState({
                        hardMode: e.target.checked,
                        guesses: [[0, 0, 0, 0, 0]],
                        bestWords: [(e.target.checked ? GAME_TREE_HARD : GAME_TREE)[0]['g']],
                        treePositions: [0],
                        finished: false,
                    }, () => { this.recomputeEVAndWordSet(0); });
                }} />
            </div>

            <div className="board-container">
                {[...Array(guesses.length).keys()].map(r => (
                    <div key={"input-row-" + r} className={`board-row ${(!finished && r == guesses.length-1) ? 'current' : ''}`}>
                        <div className="fg">
                            {!finished && r == guesses.length - 1
                                ? <div
                                className="board-ev"
                                >
                                    <span>{ev.toFixed(2)}</span>
                                    <div className="board-remaining-words">
                                        <div className="board-remaining-words-header"><b>{Object.values(wordSet).map(k => k.length).reduce((a, b) => a + b, 0)}</b> words left</div>
                                        {<div className="board-remaining-words-body">
                                            {Object.keys(wordSet).sort((a, b) => (wordSet[a].length - wordSet[b].length == 0 ? a < b : wordSet[b].length - wordSet[a].length)).slice(0, MAX_ROWS_TO_DISPLAY).map(k => renderRow(k, wordSet[k]))}
                                        </div>}
                                        {Object.keys(wordSet).length > MAX_ROWS_TO_DISPLAY ? <div className="board-remaining-words-footer">
                                            (+{Object.keys(wordSet).sort((a, b) => (wordSet[a].length - wordSet[b].length == 0 ? a < b : wordSet[b].length - wordSet[a].length)).slice(MAX_ROWS_TO_DISPLAY).map(k => wordSet[k].length).reduce((a, b) => a + b, 0)} more)
                                        </div> : undefined}
                                    </div>
                                </div>
                                : null
                            }
                        </div>
                        <div className="board">
                            <div key={"input-row-" + r} className="board-tile-container">
                                {[...Array(5).keys()].map(c => (
                                    <button
                                    key={c}
                                    className={"board-tile " + this.buttonClass(guesses[r][c])}
                                    onClick={(m) => { this.click(r, c); }}>
                                    {bestWords[r][c]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="fg">
                            {!finished && r == guesses.length - 1
                                ? <button
                                key="check"
                                className="board-submit"
                                onClick={(m) => { this.submit(); }}
                                disabled={!(this.getGuessCode() in currentNode['r'])}>
                                    ✓
                                </button>
                                : null
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>)
  }
}

const domContainer = document.querySelector('#code_container');
ReactDOM.render(e(WordleSolver), domContainer);