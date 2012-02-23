// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

package mazaa.learn.english;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
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

    public void playAudio(String url) {
        try {
        	if (mMediaPlayer != null) {
        		mMediaPlayer.stop();
        		mMediaPlayer.release();
        	}
            if (url.endsWith(".mp3")){
                Log.d("Play Audio", "Playing mp3 file");
                Map<String, String> headers = new HashMap<String, String>();
                CacheManager.CacheResult cacheResult = 
                  CacheManager.getCacheFile(url, headers);
                if (cacheResult != null) {
                  String fileName = mContext.getCacheDir() + "/webviewCache/" + 
                      cacheResult.getLocalPath();
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
            }
        } catch (Exception e) {
            Log.e("Play Audio", "error: " + e.getMessage(), e);
        }
    }
}