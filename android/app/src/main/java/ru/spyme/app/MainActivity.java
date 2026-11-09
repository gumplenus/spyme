package ru.spyme.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.bridge.getWebView().setWebViewClient(new BridgeWebViewClient(this.bridge) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Выводим ссылку в логи, чтобы видеть, что приходит от Яндекса
                android.util.Log.d("SpyMe_AUTH", "Поймана ссылка: " + url);

                // Если это обычная веб-ссылка, пусть загружается в WebView
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return super.shouldOverrideUrlLoading(view, request);
                }

                // Обработка специальных Android-ссылок (intent://)
                if (url.startsWith("intent://")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        intent.addCategory(Intent.CATEGORY_BROWSABLE);
                        intent.setComponent(null);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        // Если приложение не установлено, ищем fallback-ссылку для браузера
                        try {
                            String fallbackUrl = Intent.parseUri(url, Intent.URI_INTENT_SCHEME).getStringExtra("browser_fallback_url");
                            if (fallbackUrl != null) {
                                view.loadUrl(fallbackUrl);
                                return true;
                            }
                        } catch (Exception e2) {
                            android.util.Log.e("SpyMe_AUTH", "Ошибка парсинга intent", e2);
                        }
                    }
                } else {
                    // Обработка кастомных схем (например, yandexauth://)
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        android.util.Log.e("SpyMe_AUTH", "Ошибка открытия кастомной схемы", e);
                    }
                }
                return true;
            }
        });
    }
}