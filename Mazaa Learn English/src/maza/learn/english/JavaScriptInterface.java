// Copyright Maza Learn 2012
// @author Sridhar Sundaram

package maza.learn.english;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import android.content.Context;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.net.Uri;
import android.util.Log;
import android.webkit.CacheManager;

public class JavaScriptInterface {
  Context mContext;
  private MediaPlayer mMediaPlayer;
  private MediaRecorder mMediaRecorder;
  private final File cacheDir;
  private final String mobileNumber;

  /** Instantiate the interface and set the context */
  JavaScriptInterface(Context c, String mobileNumber) {
    mContext = c;
    cacheDir = c.getCacheDir();
    this.mobileNumber = mobileNumber;
  }
  
  /**
   * @return android version of device.
   */
  public int getVersion() {
    return android.os.Build.VERSION.SDK_INT;
  }
  
  /**
   * @return MobileNumber corresponding to this device.
   */
  public String getMobileNumber() {
    return mobileNumber;
  }

  /**
   * Plays an audio url - from web browser cache if available.
   * @param url - url of audio file
   */
  public void playAudio(String url) {
    try {
      if (mMediaPlayer != null) {
        if (mMediaPlayer.isPlaying() || mMediaPlayer.isLooping()) {
          mMediaPlayer.stop();
        }
        mMediaPlayer.release();
        mMediaPlayer = null;
      }
      if (url.endsWith("?")) return;
      Log.d("Play Audio", "Playing cached file: " + url);
      Map<String, String> headers = new HashMap<String, String>();
      CacheManager.CacheResult cacheResult = CacheManager.getCacheFile(url,
          headers);
      if (cacheResult != null) {
        String fileName = mContext.getCacheDir() + "/webviewCache/"
            + cacheResult.getLocalPath();
        FileInputStream in;
        try {
          in = new FileInputStream(fileName);
        } catch (FileNotFoundException e) {
          fileName = mContext.getCacheDir() + "/webviewCacheChromiumStaging/"
              + cacheResult.getLocalPath();
          in = new FileInputStream(fileName);
        }
        mMediaPlayer = new MediaPlayer();
        mMediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
        mMediaPlayer.setDataSource(in.getFD());
        mMediaPlayer.prepare();
      } else {
        Uri path = Uri.parse(url);
        mMediaPlayer = MediaPlayer.create(mContext, path);
      }
      if (mMediaPlayer != null) {
        mMediaPlayer.start();
      }
    } catch (Exception e) {
      Log.e("Play Audio", "error: " + e.getMessage(), e);
    }
  }

  /**
   * Plays audio file located at path
   * @param path - path for audio file
   */
  public void playRecording(String fileName) {
    String path = cacheDir + fileName;
    try {
      if (mMediaPlayer != null) {
        mMediaPlayer.stop();
        mMediaPlayer.release();
      }
      Log.d("Play Audio", "Playing recorded file: " + path);
      FileInputStream in = new FileInputStream(path);
      mMediaPlayer = new MediaPlayer();
      mMediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
      mMediaPlayer.setDataSource(in.getFD());
      mMediaPlayer.prepare();
      if (mMediaPlayer != null) {
        mMediaPlayer.start();
      }
    } catch (Exception e) {
      Log.e("Play Audio", "error: " + e.getMessage(), e);
    }
  }

  public void startRecording(String fileName) throws IOException {
    // make sure the directory we plan to store the recording in exists
    String path = cacheDir + fileName;
    File directory = new File(path).getParentFile();
    if (!directory.exists() && !directory.mkdirs()) {
      throw new IOException("Path to file could not be created.");
    }

    mMediaRecorder = new MediaRecorder();
    mMediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    mMediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
    mMediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
    mMediaRecorder.setOutputFile(path);
    mMediaRecorder.prepare();
    mMediaRecorder.start();
  }

  /**
   * Stops a recording that has been previously started.
   */
  public void stopRecording() throws IOException {
    mMediaRecorder.stop();
    mMediaRecorder.release();
    mMediaRecorder = null;
  }
}