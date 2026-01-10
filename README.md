# GhostSnap

**GhostSnap** è un prototipo di interfaccia utente sperimentale sviluppato in **React** utilizzando la libreria grafica **Fabric.js (v6)**.

Il progetto esplora il concetto di **"Invisible Drag"** e **"Delayed Snap"** per ridurre il carico cognitivo visivo durante le operazioni di editing grafico. A differenza degli editor tradizionali, dove le guide di allineamento appaiono immediatamente creando confusione ("clutter"), in GhostSnap i suggerimenti di allineamento appaiono solo quando l'utente manifesta un'intenzione precisa fermando il cursore.

## Caratteristiche Principali

### 1. Invisible Drag (Trascinamento Invisibile)
Quando l'utente inizia a trascinare un oggetto:
* L'oggetto originale diventa invisibile.
* Al suo posto, nella posizione di partenza, rimane una **copia statica (placeholder)** tratteggiata in grigio.
* Il cursore si muove "vuoto", permettendo all'utente di vedere chiaramente l'area di destinazione senza l'ostruzione dell'oggetto stesso.

### 2. Smart Ghost & Debounce Timer
Il sistema utilizza un timer per interpretare l'intenzione dell'utente:
* Se l'utente muove il mouse continuamente, non accade nulla.
* Se l'utente **si ferma per un breve lasso di tempo** (impostabile, es. 60ms o 600ms), appare un **"Fantasma" (Ghost)** blu.
* Il Fantasma mostra l'anteprima della posizione finale e si adatta alla forma dell'oggetto trascinato (Cerchio, Rettangolo, Testo o Immagine).

### 3. Allineamento Magnetico (Snap)
Se il Fantasma è visibile quando l'utente rilascia il mouse, l'oggetto reale viene "teletrasportato" (snapped) esattamente nella posizione del fantasma. Questo permette un allineamento perfetto al centro del canvas o in posizioni libere, a seconda della modalità scelta.

### 4. Gestione Storico (Undo)
È implementato un sistema di **Undo (Indietro)** che salva lo stato del canvas prima di ogni modifica. Grazie alla gestione asincrona delle Promise di Fabric.js v6, è possibile annullare spostamenti, creazioni ed eliminazioni senza errori di rendering.

---

## Controlli e Interfaccia

* **Pulsanti Oggetti:** Permettono di aggiungere Rettangoli, Cerchi, Immagini e Testo al canvas.
* **Clear:** Pulisce il canvas (azione annullabile).
* **Indietro (Undo):** Ripristina lo stato precedente del canvas.
* **Checkbox "Mostra Griglia":** Attiva/Disattiva le linee guida centrali visive.
* **Checkbox "Vincolato al Centro":**
    * *Attivo:* Il Fantasma appare **solo** se il cursore è vicino al centro del canvas (Snap vincolato).
    * *Disattivato:* Il Fantasma appare **ovunque** l'utente si fermi, permettendo di posizionare l'oggetto in qualsiasi punto dello spazio (Snap libero).

---

## Istruzioni di Installazione e Avvio

Prerequisiti: Assicurarsi di avere **Node.js** e **npm** installati.

Per avviare il programma seguire questi passaggi:

1.  Aprire il terminale (CMD o PowerShell) ed entrare nel percorso del progetto:
    ```bash
    cd C:\ghost_snap
    ```
    *(Nota: Assicurarsi che il percorso corrisponda alla posizione effettiva della cartella sul proprio computer)*

2.  Installare le dipendenze (solo la prima volta):
    ```bash
    npm install
    ```

3.  Digitare nel CMD per avviare il server di sviluppo:
    ```bash
    npm run dev
    ```

4.  Una volta avviato, aprire il browser all'indirizzo indicato:
    [http://localhost:5173/](http://localhost:5173/)