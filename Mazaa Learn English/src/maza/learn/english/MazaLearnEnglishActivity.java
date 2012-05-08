// Copyright Maza Learn 2012
// @author Sridhar Sundaram

package maza.learn.english;

import java.io.IOException;

import android.app.Activity;
import android.content.Context;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebStorage.QuotaUpdater;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MazaLearnEnglishActivity extends Activity {

  private static final String PRODUCTION_HOST = "m.mazalearn.com";
  private static final String DEBUG_EMULATOR_HOST = "10.0.2.2:8080";
  // This will keep changing - dont know how to fix this.
  private static final String DEBUG_DEVICE_HOST = "192.168.0.16:8080";
  private static final String JAVASCRIPT_INTERFACE = "android";
  private MediaPlayer mMediaPlayer;
  private static String mobileNumber;

  /**
   * @return the correct Host serving the web-pages for the web view.
   */
  private String getMazaUrl() {
    TelephonyManager tMgr = 
        (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
    String networkOperator = "";
    String path = "";
    try {
      String msisdn = tMgr.getLine1Number();
      this.mobileNumber = msisdn.substring(msisdn.length() - 10);
      networkOperator = tMgr.getNetworkOperatorName();
    } catch(RuntimeException e) {
      // Ignore: Phone does not have a SIM card.
    }
    String host = PRODUCTION_HOST;
    if("Android".equals(networkOperator)) { // Emulator
      host = DEBUG_EMULATOR_HOST;
    } else if (android.os.Debug.isDebuggerConnected()) { // Device
      host = DEBUG_DEVICE_HOST;
    }
    return "http://" + host + "/" + this.mobileNumber;
  }
  
  @Override
  public void onCreate(Bundle savedState) {
    super.onCreate(savedState);
    setContentView(R.layout.main);
    WebView myWebView = (WebView) findViewById(R.id.webview);
    myWebView.loadUrl(getMazaUrl());
    WebSettings webSettings = myWebView.getSettings();
    // Local storage
    webSettings.setDomStorageEnabled(true);
    // App Cache
    // Set cache size to 8 mb by default. should be more than enough
    webSettings.setAppCacheMaxSize(1024 * 1024 * 8);
    // This next one is crazy. It's the DEFAULT location for the app's cache
    // But it didn't work for me without this line
    String cacheDir = getCacheDir() + "";
    webSettings.setAppCachePath(cacheDir);
    webSettings.setAllowFileAccess(true);
    webSettings.setAppCacheEnabled(true);
    webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
    // Javascript
    webSettings.setJavaScriptEnabled(true);
    JavaScriptInterface javaScriptInterface = 
        new JavaScriptInterface(this, this.mobileNumber);
    myWebView.addJavascriptInterface(javaScriptInterface, JAVASCRIPT_INTERFACE);

    myWebView.setWebViewClient(new WebViewClient() {
      @SuppressWarnings("unused")
      public void onReachedMaxAppCacheSize(long spaceNeeded,
          long totalUsedQuota, QuotaUpdater quotaUpdater) {
        quotaUpdater.updateQuota(spaceNeeded * 2);
      }
    });
    // this is necessary for "alert()" to work
    myWebView.setWebChromeClient(new WebChromeClient());
    setVolumeControlStream(AudioManager.STREAM_MUSIC);
    // allows the control to receive focus
    // on some versions of Android the webview doesn't handle input focus
    // properly
    // this seems to make things work with Android 2.1, but not 2.2
    // myWebView.requestFocusFromTouch();

    // recordAudio(javaScriptInterface);
  }

  private void recordAudio(JavaScriptInterface javaScriptInterface) {
    try {
      javaScriptInterface.startRecording("/temp4.3gp");
      //….wait a while, better would be to time out and stop
      Thread.sleep(4000); 
      javaScriptInterface.stopRecording();
      Log.i("Record Audio", "Recording done");
      javaScriptInterface.playRecording("/temp4.3gp");
      Log.i("Record Audio", "Playback done");
    } catch (IOException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } catch (InterruptedException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    if (mMediaPlayer != null) {
      mMediaPlayer.release();
      mMediaPlayer = null;
    }

  }
}
