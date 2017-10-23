/**
 * Record audio from MediaStream into raw AudioBuffer
 */
class RawMediaRecorder {
  readonly ctx: AudioContext
  readonly stream: MediaStream
  readonly bufferSize: number
  private source: MediaStreamAudioSourceNode
  private buffers: Float32Array[]
  private script?: ScriptProcessorNode

  /** Funciton to call when recording started */
  onstart: () => void
  /** Funciton to call when recording stoped */
  onstop: () => void
  /** Called when data recorded and available */
  ondata: (AudioBuffer) => void

  constructor(
    audioContext: AudioContext,
    stream: MediaStream,
    bufferSize = 4096
  ) {
    this.ctx = audioContext
    this.stream = stream
    this.bufferSize = bufferSize

    this.source = audioContext.createMediaStreamSource(stream)

    this.onstart = () => console.log("recording started")
    this.onstop = () => console.log("recording stoped")
    this.ondata = data => console.log("data available")

    this.buffers = []
  }

  /** Start recording */
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

  /** Stop recording */
  stop() {
    this.source.disconnect(this.script)
    this.script.disconnect(this.ctx.destination)

    let buffers = this.buffers
    this.buffers = []
    this.onstop()

    setImmediate(() => this.exportData(buffers))
  }

  private exportData(buffers) {
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
}

export default RawMediaRecorder
