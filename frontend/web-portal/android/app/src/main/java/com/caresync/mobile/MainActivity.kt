package com.caresync.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NfcPlugin.class); // <--- Add this line
        super.onCreate(savedInstanceState);
    }
}
