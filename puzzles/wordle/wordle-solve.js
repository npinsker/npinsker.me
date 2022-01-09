'use strict';

const e = React.createElement;

class WordleSolver extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        guesses: [[0, 0, 0, 0, 0]],
        bestWords: [GAME_TREE[0]['guess']],
        treePositions: [0],
        finished: false,
        hardMode: false,
    };

    this.submit = this.submit.bind(this)
    this.getGuessCode = this.getGuessCode.bind(this)
    this.treeInUse = this.treeInUse.bind(this)
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
  }

  treeInUse = () => (this.state.hardMode ? GAME_TREE_HARD : GAME_TREE)

  getGuessCode = () => [...Array(5).keys()]
      .map(i => this.state.guesses[this.state.guesses.length - 1][i] * Math.pow(3, i))
      .reduce((a, b) => a + b)

  submit() {
      let { bestWords, guesses, treePositions, hardMode } = this.state

      let newTreePosition = this.treeInUse()[treePositions[treePositions.length - 1]]['results'][this.getGuessCode()]
      let finished = (Object.keys(this.treeInUse()[newTreePosition]['results']).length == 0)

      this.setState({
          treePositions: [...treePositions, newTreePosition],
          bestWords: [...bestWords, this.treeInUse()[newTreePosition]['guess']],
          guesses: [...guesses, guesses[guesses.length - 1].map(g => (finished || (hardMode && g == 2) ? 2 : 0))],
          finished,
      })

    }

  buttonClass(mod) {
      return ['button-gray', 'button-yellow', 'button-green'][mod]
  }

  render() {
    let { bestWords, guesses, treePositions, finished, hardMode } = this.state
    let currentNode = this.treeInUse()[treePositions[treePositions.length - 1]]

    return (<div style={{minHeight: '400px'}}>
        <div className="container">
            <div className="hard-mode">
                <span> hard mode </span>
                <input type="checkbox" value={hardMode} onChange={(e) => {
                    this.setState({
                        hardMode: e.target.checked,
                        guesses: [[0, 0, 0, 0, 0]],
                        bestWords: [(e.target.checked ? GAME_TREE_HARD : GAME_TREE)[0]['guess']],
                        treePositions: [0],
                        finished: false,
                    });
                }} />
            </div>

            <div className="board-container">
                {[...Array(guesses.length).keys()].map(r => (
                    <div key={"input-row-" + r} className={`board-row ${(!finished && r == guesses.length-1) ? 'current' : ''}`}>
                        <div className="fg">
                            {!finished && r == guesses.length - 1
                                ? <div
                                className="board-ev"
                                title="Expected number of guesses left"
                                >
                                    ({currentNode.ev.toFixed(2)})
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
                                disabled={!(this.getGuessCode() in currentNode['results'])}>
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