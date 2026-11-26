# Luisa 💗

App de Android para guardar todo sobre Luisa: notas, recordatorios, fotos de momentos lindos
y un aviso **todos los días a las 6:00 a. m.** para darle los buenos días.

## Qué tiene

- **Inicio**: su nombre en grande, los días que llevan juntos, una racha de "buenos días" 🔥
  y mensajitos bonitos listos para copiar, compartir o mandar por WhatsApp.
- **Notas**: lo que le encanta, lo que no le gusta, ideas de regalo, planes, recuerdos y datos importantes
  (cumpleaños, tallas, flor favorita…). Con buscador y notas fijadas.
- **Recordatorios**: ☀️ buenos días a las 6:00, 💌 algo bonito a la 1:00 p. m. y 🌙 buenas noches a las 9:30 p. m.
  (todos se pueden cambiar). Crea los tuyos: una vez, diario, semanal, mensual o anual.
  Si guardas su cumpleaños y su aniversario en Ajustes, te avisa solo.
- **Fotos**: galería tipo polaroid con descripción y fecha. Se guardan dentro de la app.
- **Copia de seguridad** (Ajustes): guarda todo en un archivo, por ejemplo en Google Drive.

Todo se guarda solo en el celular; no necesita internet ni cuenta.

## Cómo instalarla en el celular

1. En el celular, entra a la pestaña **Releases** de este repositorio en GitHub
   (o a **Actions → la compilación más reciente → Artifacts**).
2. Descarga **Luisa.apk** y ábrelo.
3. Si Android lo pide, permite **"Instalar apps desconocidas"**.
4. Abre la app y toca **"Activar notificaciones"**.
5. Recomendado: Ajustes del teléfono → Apps → Luisa → Batería → **Sin restricciones**,
   para que el aviso de las 6:00 llegue puntual.

Para actualizar, instala el APK nuevo encima del anterior: las notas y fotos se conservan
(todas las versiones se firman con la misma llave, `android/app/luisa-debug.keystore`).

## Para desarrollar

```bash
npm install          # también aplica el parche de notificaciones (patches/)
npm run dev          # ver la app en el navegador
npm run sync         # construir y copiar a android/
cd android && ./gradlew assembleRelease
```

Hecha con [Capacitor](https://capacitorjs.com) + Vite. La gatita "Mimi" es un dibujo original.
El parche en `patches/` hace que los recordatorios repetidos usen alarmas exactas que despiertan el
celular, para que el de las 6:00 no se retrase cuando el teléfono está en reposo.
