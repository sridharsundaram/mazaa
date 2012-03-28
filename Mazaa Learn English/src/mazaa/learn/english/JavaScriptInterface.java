// Copyright Maza Learn 2012
// @author Sridhar Sundaram

package mazaa.learn.english;

import java.io.FileInputStream;
import java.util.HashMap;
import java.util.Map;

import android.content.Context;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.util.Log;
import android.webkit.CacheManager;

public class JavaScriptInterface {
  Context mContext;
  private MediaPlayer mMediaPlayer;

  /** Instantiate the interface and set the context */
  JavaScriptInterface(Context c) {
    mContext = c;
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
        FileInputStream in = new FileInputStream(fileName);
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
  public void playRecordedAudio(String path) {
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

  public String recordAudio() {
    return null;
  }
}