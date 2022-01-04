'use strict';

const e = React.createElement;

class WordleSolver extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        guesses: [[0, 0, 0, 0, 0]],
        bestWords: ['aeons'],
        treePositions: [0],
        finished: false,
    };

    this.submit = this.submit.bind(this)
    this.getGuessCode = this.getGuessCode.bind(this)
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

  getGuessCode = () => [...Array(5).keys()]
      .map(i => this.state.guesses[this.state.guesses.length - 1][i] * Math.pow(3, i))
      .reduce((a, b) => a + b)

  submit() {
      let { bestWords, guesses, treePositions } = this.state

      let newTreePosition = GAME_TREE[treePositions[treePositions.length - 1]]['results'][this.getGuessCode()]
      let finished = (Object.keys(GAME_TREE[newTreePosition]['results']).length == 0)
      this.setState({
          treePositions: [...treePositions, newTreePosition],
          bestWords: [...bestWords, GAME_TREE[newTreePosition]['guess']],
          guesses: [...guesses, new Array(5).fill(finished ? 2 : 0)],
          finished,
      })
  }

  buttonClass(mod) {
      return ['button-gray', 'button-yellow', 'button-green'][mod]
  }

  render() {
    let { bestWords, guesses, treePositions, finished } = this.state
    let currentNode = GAME_TREE[treePositions[treePositions.length - 1]]

    return (<div style={{minHeight: '400px'}}>
        <div className="board-container">
            <div className="board">
                {[...Array(guesses.length).keys()].map(r => (
                    <div key={"input-row-" + r} className="board-row">
                        {[...Array(5).keys()].map(c => (
                            <button
                            key={c}
                            className={"board-tile " + this.buttonClass(guesses[r][c])}
                            onClick={(m) => { this.click(r, c); }}>
                            {bestWords[r][c]}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
            {!finished
                ? <button
                key="check"
                className="board-submit"
                onClick={(m) => { this.submit(); }}
                disabled={!(this.getGuessCode() in currentNode['results'])}>
                    ✓
                </button>
                : undefined
            }
        </div>
    </div>)
  }
}

const domContainer = document.querySelector('#code_container');
ReactDOM.render(e(WordleSolver), domContainer);