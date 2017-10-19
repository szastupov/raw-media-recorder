class RawMediaRecorder {
  ctx: AudioContext
  stream: MediaStream
  bufferSize: number
  source: MediaStreamAudioSourceNode
  buffers: Float32Array[]
  script?: ScriptProcessorNode

  onstart: () => void
  onstop: () => void
  ondata: (AudioBuffer) => void

  constructor(audioContext, stream, bufferSize = 4096) {
    this.ctx = audioContext
    this.stream = stream
    this.bufferSize = bufferSize

    this.source = audioContext.createMediaStreamSource(stream)

    this.onstart = () => console.log("recording started")
    this.onstop = () => console.log("recording stoped")
    this.ondata = data => console.log("data available")

    this.buffers = []
  }

  exportData(buffers) {
    let totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0)
    let audioBuffer = this.ctx.createBuffer(1, totalLength, this.ctx.sampleRate)
    let outChannel = audioBuffer.getChannelData(0)

    let offset = 0
    for (let buffer of buffers) {
      outChannel.set(buffer, offset)
      offset += buffer.length
    }

    this.ondata(audioBuffer)
  }

  start() {
    const script = this.ctx.createScriptProcessor(this.bufferSize, 1, 1)
    this.script = script

    script.onaudioprocess = ev => {
      this.buffers.push(ev.inputBuffer.getChannelData(0).slice())
    }

    this.source.connect(script)
    script.connect(this.ctx.destination)

    this.onstart()
  }

  stop() {
    this.source.disconnect(this.script)
    this.script.disconnect(this.ctx.destination)

    let buffers = this.buffers
    this.buffers = []
    this.onstop()

    setImmediate(() => this.exportData(buffers))
  }
}

export default RawMediaRecorder
