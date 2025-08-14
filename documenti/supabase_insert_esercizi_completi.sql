-- Script per inserire tutti gli esercizi dal file esercizi.csv
-- Con analisi dei landmarks MediaPipe per ogni esercizio

-- Inserimento esercizi con landmarks analizzati
INSERT INTO esercizi (id_categoria, nome_esercizio, descrizione_esecuzione, note, landmark) VALUES

-- CATEGORIA 1: CERVICALE
(1, 'Flessione anteriore e posteriore del collo', 
'Seduti su uno sgabello con il busto eretto, gambe e piedi uniti, testa alta e sguardo in avanti, braccia lungo i fianchi, spalle rilassate. Espirando, inclinare lentamente il capo fino a toccare il petto con il mento; inspirando, tornare alla posizione iniziale.',
'Mantenere la posizione per 20/30 secondi. Fare 10 ripetizioni.',
ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12]),

(1, 'Flessione laterale del collo',
'In piedi, flettere lentamente di lato il collo; con la mano del lato verso il quale è piegato il capo, spingere leggermente verso il basso la testa (avvicinando l''orecchio alla spalla) in modo da praticare una leggera tensione. Piegare l''altro braccio a 90 gradi portando la mano dietro la schiena.',
'Mantenere la posizione per 20-30 secondi e cambiare lato. Fare 10 ripetizioni.',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(1, 'Inclinazione laterale del collo con rotazione',
'In piedi o seduti con la schiena eretta flettere lentamente il collo a destra, indietro, a sinistra e in avanti in modo da compiere una circonduzione completa del capo. Tenere spalle e collo rilassati durante tutto l''arco del movimento e ripetere in senso inverso.',
'Fare 10 ripetizioni.',
ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12]),

(1, 'Flessione laterale (stretching trapezio)',
'In piedi o seduti flettere lentamente di lato il collo. Con la mano del lato verso il quale è piegato il collo afferrare il polso del braccio opposto e tirarlo leggermente verso il basso in modo da mettere in tensione i muscoli del trapezio e della spalla controlaterali.',
'Mantenere la posizione per 20-30 secondi e cambiare lato. Fare 10 ripetizioni.',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(1, 'Estensione del collo',
'Senza inarcare la schiena, lentamente muovere la testa all''indietro così da guardare verso l''alto.',
'Mantenere la posizione per cinque secondi. Tornare alla posizione di partenza. Fare 10 ripetizioni.',
ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12]),

(1, 'Rotazione del collo',
'Iniziate guardando dritto davanti a voi. Lentamente girare la testa a sinistra. Mantenere la rotazione per dieci secondi, poi tornare alla posizione di partenza. Quindi, lentamente, girare la testa verso il lato opposto.',
'Mantenere la rotazione per dieci secondi e poi tornare alla posizione di partenza. Fare 10 ripetizioni.',
ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12]),

(1, 'ESERCIZI CONTRO RESISTENZA PER I MUSCOLI DEL COLLO',
'Iniziate guardando dritto davanti a voi. Lentamente inclinare la testa in una direzione (in avanti, indietro, di lato) usando la mano per fare resistenza, premere contro di essa usando i muscoli del collo.',
'Mantenere la pressione per 5 secondi quindi tornare alla posizione di partenza. Fare 10 ripetizioni.',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(1, 'STRETCHING PROFONDO',
'Seduti col busto eretto, lasciate ricadere il capo verso il petto. Potete incrementare la pressione spingendo con le mani come mostrato in figura.',
'Mantenere la pressione per 30 secondi quindi rilasciare. Ripetere 3 volte.',
ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(1, 'ALLUNGAMENTO DEL RACHIDE CERVICALE',
'In piedi, tenere i lati di un asciugamano posato sopra la testa. Spingere il capo verso l''alto, applicando una resistenza all''asciugamano che tira il capo verso il basso.',
'Mantenere la posizione da 6 a 10 secondi, meno in caso di dolore. Fare serie di 5 movimenti con pause (2 volte più lunghe del movimento stesso).',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(1, 'ESTENSIONE DEL RACHIDE CERVICALE',
'In piedi, un asciugamano dietro la testa mantenuto ai due lati, spingere la testa all''indietro contro la resistenza dell''asciugamano tirato con le mani in avanti.',
'Fare durare il movimento alcuni secondi (da 6 a 10), fermandosi se diventa troppo doloroso. Serie di 5 movimenti con pause pari al doppio della durata dell''esercizio.',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(1, 'ESTENSIONE DEL RACHIDE CERVICALE',
'Ben seduti su una poltrona con schienale alto, spingete la testa contro lo schienale stesso mantenendo bene il mento in orizzontale.',
'Fare serie di 5 movimenti con pause (2 volte più lunghe del movimento stesso).',
ARRAY[0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12]),

-- CATEGORIA 2: SPALLA
(2, 'PENDOLO (di Codman)',
'In piedi, flette il busto in avanti (45° o 90°), appoggiandosi con l''arto sano su un supporto (ad es. un tavolo) e mantenendo il rachide correttamente allineato e le ginocchia piegate; rilassare l''arto interessato facendolo ruotare in senso orario e antiorario. Eventualmente si può svolgere l''esercizio impugnando un peso leggero.',
'20 circonduzioni per ogni senso di rotazione (orario e antiorario) 2/3 ripetizioni del set 2/3 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]),

(2, 'ROTAZIONE INTERNA/ESTERNA',
'In posizione supina e con entrambi i gomiti appoggiati piegati a 90°, impugnare un bastone con il palmo della mano dell''arto interessato verso l''alto, con l''altra mano con il palmo rivolto verso il basso, spingere verso l''esterno il bastone. Quando si avverte tensione, mantenere la posizione per 30 secondi. Ripetere l''esercizio in direzione controlaterale.',
'3/5 ripetizioni in ogni direzione 1/2 ripetizioni del set 1/2 volte al giorno',
ARRAY[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'STRETCHING PER L''INTRAROTAZIONE',
'Con l''arto interessato posizionato dietro la schiena, impugnare un asciugamano e tirarlo dolcemente verso l''alto con l''arto non interessato. Quando si sente tensione, mantenere 30 secondi.',
'3/5 ripetizioni 1/2 ripetizioni del set 1/2 volte al giorno',
ARRAY[11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'STRECHING PER LA FLESSIONE',
'Da seduti, appoggiare l''arto interessato sul tavolo e piegare il tronco dolcemente in avanti fino ad avvertire una sensazione di tensione. Quando si sente tensione, mantenere 30 secondi.',
'2/3 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'STRETCHING CAPSULA POSTERIORE',
'Appoggiare la spalla interessata contro il muro e portare la mano dell''arto interessato sulla spalla controlaterale, con la spalla in flessione a 90°. Con l''altra mano spingere il gomito verso il lato opposto fino all''altezza dello sterno. Quando si sente tensione, mantenere la posizione per 30 secondi.',
'2/3 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'STRETCHING CAPSULA POSTERIORE',
'Alzare il gomito dell''arto interessato sopra la testa e portare la mano dietro la schiena. Con l''altra mano afferrare il gomito e tirare dolcemente. Quando si sente tensione, mantenere la posizione per 30 secondi.',
'2/3 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ADDUZIONE SCAPOLARE',
'Con gli arti lungo i fianchi, cercare di avvicinare le scapole spingendo le spalle all''indietro. Mantenere la posizione per 15 secondi.',
'15 ripetizioni 2/3 ripetizioni del set 2/3 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ADDUTTORI SCAPOLARI',
'Con l''arto non interessato in appoggio sul tavolo, tronco flesso anteriormente e rachide allineato; alzare il gomito dell''arto interessato adducendo la scapola. Eventualmente utilizzare un peso leggero.',
'15 ripetizioni 2/3 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ANTEPOSIZIONE DI SCAPOLA',
'Da sdraiati in posizione supina, impugnare due pesi leggeri. Mantenendo il rachide e il capo bene appoggiati a terra, spingere i pesi verso l''alto.',
'15 ripetizioni 2/3 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ESTENSIONE DI SPALLA',
'Da proni (a pancia in giù), impugnare due pesi leggeri e sollevarli, mantenendo i gomiti estesi.',
'15 ripetizioni 2/3 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'FLESSIONE ISOMETRICA',
'Usando il muro come resistenza, con il gomito a 90°, spingere dolcemente una palla morbida e mantenere la pressione per 10 secondi.',
'10 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ADDUZIONE ISOMETRICA',
'Usando il proprio corpo come resistenza, con il gomito a 90°, stringere dolcemente una palla morbida e mantenere la pressione per 10 secondi.',
'10 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'EXTRAROTAZIONE ISOMETRICA',
'Usando il muro come resistenza, con il gomito a 90°, spingere dolcemente una palla morbida con l''esterno dell''avambraccio e mantenere la pressione per 10 secondi.',
'10 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'INTRAROTAZIONE ISOMETRICA',
'Usando il muro come resistenza, con il gomito a 90°, stringere dolcemente una palla morbida e mantenere la pressione per 10 secondi.',
'10 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ABDUZIONE ISOMETRICA',
'Usando il muro come resistenza, con il gomito a 90°, spingere dolcemente una palla morbida con l''esterno dell''omero, mantenere la pressione per 10 secondi.',
'10 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ESTENSIONE ISOMETRICA',
'Usando il muro come resistenza, con il gomito a 90°, spingere dolcemente una palla morbida con l''esterno dell''omero, mantenere la pressione per 10 secondi.',
'10 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'RINFORZO INTRAROTATORI',
'Mantenere il tronco fermo ed in posizione eretta, impugnare un elastico e ruotare l''arto interessato internamente, mantenendo il gomito a 90°.',
'15 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'RINFORZO EXTRAROTATORI 1',
'Mantenere il tronco fermo ed in posizione eretta, impugnare un elastico e ruotare l''arto interessato esternamente, mantenendo il gomito a 90°.',
'15 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'RINFORZO EXTRAROTATORI 2',
'Sdraiati sul fianco, impugnare un peso leggero e ruotare l''arto interessato esternamente, mantenendo il gomito a 90°.',
'15 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'RINFORZO ESTENSORI',
'Mantenere il tronco fermo ed in posizione eretta, impugnare un elastico e, a gomito esteso, tirare all''indietro.',
'15 ripetizioni 2 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'RINFORZO ESTENSORI',
'Impugnando un elastico, a gomito esteso, tirare verso il basso',
'15 ripetizioni 2 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ESTESIONE PASSIVA DI GOMITO',
'Appoggiare il gomito con il palmo della mano rivolto perso l''alto su una superficie morbida di 3/4 cm e usare l''altro arto per spingere dolcemente la mano verso il basso.',
'2/3 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'ESTENSIONE DI GOMITO',
'Da supini, con il gomito flesso, estenderlo completamente Eventualmente un peso leggero.',
'15 ripetizioni 2/3 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'PRONOSUPINAZIONE',
'Gomito flesso a 90°, partendo con il palmo della mano rivolto verso il basso, girarlo verso l''alto e viceversa.',
'15 ripetizioni 2/3 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]),

(2, 'STRETCHING FLESSORI DI POLSO',
'Con il gomito esteso, usare l''arto non interessato per portare polso e dita in estensione. Quando si sente tensione, mantenere per 30 secondi.',
'2/3 ripetizioni 1 ripetizioni del set 1/2 volte al giorno',
ARRAY[0, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);

-- Continuo con le altre categorie in un secondo script per evitare errori di dimensione
