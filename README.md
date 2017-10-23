# Raw Media Recorder

Record audio from your microphone into AudioBuffer, useful when your browser (hi Safari 👋) doesn't support MediaRecorder or you don't want to decode from Opus.

## Install
``` yarn add raw-media-recorder ```

or

``` npm install raw-media-recorder ```

## Usage

```javascript
let recorder

// ...

navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(stream => {
        recorder = new RawMediaRecorder(new AudioContext(), stream)
        recorder.onstart = () => {
            // Indicate recording, for example
            // this.setState({ recording: true })
        }
        recorder.onstop = () => {
            // On recording stoped, for example
            // this.setState({ recording: false })
        }
        recorder.ondata = data => {
            // Data recorder as AudioBuffer
        }
    })
    .catch(err => console.error(err))

// Start recording
recorder.start()

// Stop recording
recorder.stop()
```
