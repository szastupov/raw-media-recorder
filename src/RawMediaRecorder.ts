/**
 * Record audio from MediaStream into raw AudioBuffer
 */
class RawMediaRecorder {
  readonly ctx: AudioContext
  readonly bufferSize: number
  private stream: MediaStream
  private source: MediaStreamAudioSourceNode
  private buffers: Float32Array[]
  private script?: ScriptProcessorNode
  public analyser?: AnalyserNode

  /** Funciton to call when recording started */
  onstart: () => void
  /** Funciton to call when recording stoped */
  onstop: () => void
  /** Called when data recorded and available */
  ondata: (AudioBuffer) => void

  constructor(audioContext: AudioContext, bufferSize = 4096) {
    this.ctx = audioContext
    this.bufferSize = bufferSize

    this.onstart = () => console.log("recording started")
    this.onstop = () => console.log("recording stoped")
    this.ondata = data => console.log("data available")

    this.buffers = []
  }

  /** Start recording */
  start() {
    this.ctx
      .resume()
      .then(() =>
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      )
      .then(stream => this.startStream(stream))
      .catch(err => console.error(err))
  }

  private startStream(stream: MediaStream) {
    const source = this.ctx.createMediaStreamSource(stream)
    const analyser = this.ctx.createAnalyser()
    const script = this.ctx.createScriptProcessor(this.bufferSize, 1, 1)

    script.onaudioprocess = ev => {
      this.buffers.push(ev.inputBuffer.getChannelData(0).slice())
    }

    source.connect(analyser)
    analyser.connect(script)
    script.connect(this.ctx.destination)

    this.stream = stream
    this.source = source
    this.analyser = analyser
    this.script = script
    this.onstart()
  }

  /** Stop recording */
  stop(finish = true) {
    this.stream.getTracks().forEach(track => track.stop())
    this.source.disconnect()
    this.analyser.disconnect()
    this.script.disconnect()

    let buffers = this.buffers

    this.buffers = []
    this.stream = null
    this.source = null
    this.analyser = null
    this.script = null
    this.onstop()

    if (finish) {
      setTimeout(() => this.exportData(buffers), 100)
    }
  }

  /** Cancel recording, onstop will be called but not ondata */
  cancel() {
    this.stop(false)
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
