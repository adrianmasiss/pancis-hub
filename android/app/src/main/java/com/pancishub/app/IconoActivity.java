package com.pancishub.app;

import android.app.Activity;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;

/**
 * Cambia el icono del lanzador al acento elegido en la app.
 *
 * La web, al elegir un acento en Perfil, abre pancis://icono/<acento>. Cada
 * acento es un activity-alias del manifiesto con su icono; se enciende el
 * del acento y se apagan los demas. No abre nada: termina al instante.
 */
public class IconoActivity extends Activity {
    static final String[] ACENTOS = {
        "naranja", "rosa", "lima", "menta", "burgundy", "gold", "cyan", "merlot"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Uri uri = getIntent().getData();
        String elegido = uri != null ? uri.getLastPathSegment() : null;
        boolean valido = false;
        for (String a : ACENTOS) if (a.equals(elegido)) valido = true;
        if (valido) {
            PackageManager pm = getPackageManager();
            // Primero se enciende el nuevo: nunca queda la app sin icono.
            pm.setComponentEnabledSetting(
                alias(elegido),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP);
            for (String a : ACENTOS) {
                if (a.equals(elegido)) continue;
                pm.setComponentEnabledSetting(
                    alias(a),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP);
            }
        }
        finish();
    }

    private ComponentName alias(String acento) {
        String nombre = Character.toUpperCase(acento.charAt(0)) + acento.substring(1);
        return new ComponentName(this, getPackageName() + ".Icono" + nombre);
    }
}
