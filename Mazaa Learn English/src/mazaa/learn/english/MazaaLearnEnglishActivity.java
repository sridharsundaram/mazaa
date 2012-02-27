// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

package mazaa.learn.english;

import android.app.Activity;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebStorage.QuotaUpdater;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MazaaLearnEnglishActivity extends Activity {

    private static final String PRODUCTION_HOST = "yaksha-sridhar.appspot.com";
	private static final String DEBUG_HOST = "10.0.2.2:8080";
    private static final String JAVASCRIPT_INTERFACE = "android";
	private MediaPlayer mMediaPlayer;

    @Override
    public void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        setContentView(R.layout.main);
        WebView myWebView = (WebView) findViewById(R.id.webview);
        String host = android.os.Debug.isDebuggerConnected() 
        		? DEBUG_HOST : PRODUCTION_HOST;
        myWebView.loadUrl("http://" + host + "/lesson1.html");
        WebSettings webSettings = myWebView.getSettings();
        // Local storage
        webSettings.setDomStorageEnabled(true);
        // App Cache
        // Set cache size to 8 mb by default. should be more than enough
        webSettings.setAppCacheMaxSize(1024*1024*8);
        // This next one is crazy. It's the DEFAULT location for your app's cache
        // But it didn't work for me without this line
        webSettings.setAppCachePath("/data/data/mazaa.learn.english/cache");
        webSettings.setAllowFileAccess(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Javascript
        webSettings.setJavaScriptEnabled(true);
        myWebView.addJavascriptInterface(
          new JavaScriptInterface(this), JAVASCRIPT_INTERFACE);

        myWebView.setWebViewClient(new WebViewClient() {
        	@SuppressWarnings("unused")
			public void onReachedMaxAppCacheSize(
        	  long spaceNeeded, long totalUsedQuota, QuotaUpdater quotaUpdater) {
                quotaUpdater.updateQuota(spaceNeeded * 2);
             }
        });
        // this is necessary for "alert()" to work
        myWebView.setWebChromeClient(new WebChromeClient());
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        // allows the control to receive focus
        // on some versions of Android the webview doesn't handle input focus properly
        // this seems to make things work with Android 2.1, but not 2.2
        // myWebView.requestFocusFromTouch();
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
