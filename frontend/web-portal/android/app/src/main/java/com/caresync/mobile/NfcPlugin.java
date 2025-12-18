package com.caresync.mobile;

import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CustomNfc")
public class NfcPlugin extends Plugin implements NfcAdapter.ReaderCallback {

    private NfcAdapter nfcAdapter;

    @Override
    public void load() {
        // Initialize the adapter when the plugin loads
        this.nfcAdapter = NfcAdapter.getDefaultAdapter(getContext());
    }

    @PluginMethod
    public void startScan(PluginCall call) {
        if (nfcAdapter == null) {
            call.reject("NFC is not supported on this device");
            return;
        }

        if (!nfcAdapter.isEnabled()) {
            call.reject("NFC is disabled in settings");
            return;
        }

        // We need to run NFC operations on the main UI thread
        getActivity().runOnUiThread(() -> {
            try {
                // FLAGS:
                // NFC_A, NFC_B, NFC_F, NFC_V, ISO_DEP, MIFARE_CLASSIC
                // FLAG_READER_SKIP_NDEF_CHECK prevents the system sounds from playing twice
                int flags = NfcAdapter.FLAG_READER_NFC_A |
                            NfcAdapter.FLAG_READER_NFC_B |
                            NfcAdapter.FLAG_READER_NFC_F |
                            NfcAdapter.FLAG_READER_NFC_V |
                            NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS;

                nfcAdapter.enableReaderMode(
                        getActivity(),
                        this, // This class implements the callback
                        flags,
                        null
                );

                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to start NFC scan: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopScan(PluginCall call) {
        if (nfcAdapter != null) {
            getActivity().runOnUiThread(() -> {
                nfcAdapter.disableReaderMode(getActivity());
                call.resolve();
            });
        } else {
            call.resolve();
        }
    }

    // This method is called by Android when a tag is tapped
    @Override
    public void onTagDiscovered(Tag tag) {
        // Parse the Tag ID to a readable Hex String
        byte[] idBytes = tag.getId();
        String hexId = bytesToHex(idBytes);

        // Create the data object to send to JavaScript
        JSObject ret = new JSObject();
        ret.put("tagId", hexId);
        ret.put("timestamp", System.currentTimeMillis());

        // Notify the JavaScript listener
        // In JS: CustomNfc.addListener('nfcTagDetected', (data) => { ... })
        notifyListeners("nfcTagDetected", ret);
    }

    // Utility to convert raw bytes to Hex String (e.g., "04:3A:...")
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
            sb.append(":"); // Add colon separator
        }
        if (sb.length() > 0) {
            sb.setLength(sb.length() - 1); // Remove trailing colon
        }
        return sb.toString();
    }
}
