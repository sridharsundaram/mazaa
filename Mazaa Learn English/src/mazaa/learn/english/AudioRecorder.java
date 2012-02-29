// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

package mazaa.learn.english;

import java.io.File;
import java.io.IOException;

import android.media.MediaRecorder;

public class AudioRecorder {

  final MediaRecorder recorder = new MediaRecorder();
  final String path;

  /**
   * Creates a new audio recording at the given path.
   */
  public AudioRecorder(String path) {
    this.path = path;
  }

  /**
   * Starts a new recording.
   */
  public void start() throws IOException {
    // make sure the directory we plan to store the recording in exists
    File directory = new File(path).getParentFile();
    if (!directory.exists() && !directory.mkdirs()) {
      throw new IOException("Path to file could not be created.");
    }

    recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    recorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
    recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
    recorder.setOutputFile(path);
    recorder.prepare();
    recorder.start();
  }

  /**
   * Stops a recording that has been previously started.
   */
  public void stop() throws IOException {
    recorder.stop();
    recorder.release();
  }
}