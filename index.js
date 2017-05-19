var parser = require('./lib/parser')

module.exports = {
  parse: function(input) {
    try {
      return parser.parse(input.toString())
    } catch (e) {
      console.log(e)
      console.log(e.location)
      const start = Math.max(e.location.start.offset - 10, 0)
      const end = Math.max(e.location.end.offset + 10, input.length)
      console.log(input.toString().substr(start, end))
      console.log(new Buffer(input.toString().substr(start, end)))
      throw e
    }
  }
}
