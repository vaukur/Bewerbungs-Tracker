let data = JSON.parse(localStorage.getItem('bewerbungen')) || [];

function render() {
    // AUTO-LOAD JSON als Fallback
    if (data.length === 0) {
        fetch('./bewerbungen.json')
            .then(res => res.json())
            .then(jsonData => {
                data = jsonData;
                saveData();
                localStorage.setItem('bewerbungen', JSON.stringify(data));
            })
            .catch(err => console.log('JSON optional'));
    }
// Parst DD.MM.YYYY → Date (Fix für deutsches Format!)
function parseGermanDate(dateStr) {
    if (!dateStr) return new Date('1900-01-01');
    const parts = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!parts) return new Date('1900-01-01');
    const [, day, month, year] = parts;
    return new Date(year, month - 1, day);  // Monat -1 (JS zählt ab 0)
}

function saveData() {
    localStorage.setItem('bewerbungen', JSON.stringify(data));
}

function deleteEntry(index) {
    data.splice(index, 1);
    saveData();
    render();
}

function sortByDateDesc() {
    data.sort((a, b) => parseGermanDate(b.datum) - parseGermanDate(a.datum));
}

function render() {
    sortByDateDesc();
    saveData();
    
    const statusMap = {
        ausstehend: document.querySelector('#ausstehend ul'),
        zugesagt: document.querySelector('#zugesagt ul'),
        abgelehnt: document.querySelector('#abgelehnt ul')
    };

    Object.keys(statusMap).forEach(status => {
        const ul = statusMap[status];
        ul.innerHTML = '';
        
        const filtered = data
            .filter(entry => entry.status === status)
            .sort((a, b) => parseGermanDate(b.datum) - parseGermanDate(a.datum));
            
        filtered.forEach((entry) => {
            const entryIndex = data.findIndex(e => 
                e.firma === entry.firma && 
                e.datum === entry.datum &&
                e.notiz === entry.notiz
            );
            
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="entry-content">
                    <strong>${entry.firma}</strong><br>
                    <small style="color: #666;">
                        📅 ${entry.datum || 'kein Datum'} | ${entry.notiz || ''}
                    </small>
                </div>
                <button class="delete-btn" onclick="deleteEntry(${entryIndex})">🗑️</button>
            `;
            ul.appendChild(li);
        });
        
        document.querySelector(`#${status} .count`).textContent = `(${filtered.length})`;
    });
}

document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault();
   
    document.getElementById('import').addEventListener('click', () => {
    document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const importedData = JSON.parse(ev.target.result);
                if (Array.isArray(importedData)) {
                    data = importedData;
                    saveData();
                    render();
                    alert('✅ Importiert! ' + data.length + ' Firmen geladen.');
                }
            } catch (err) {
                alert('❌ Fehler: Ungültige JSON-Datei');
            }
        };
        reader.readAsText(file);
    }
});
    
    const firma = document.getElementById('firma').value.trim();
    const status = document.getElementById('status').value;
    const datum = document.getElementById('datum').value.trim();
    const notiz = document.getElementById('notiz').value.trim();
    
    if (firma && datum) {
        data.push({ firma, status, datum, notiz });
        saveData();
        render();
        e.target.reset();
    }
});

document.getElementById('migrate').addEventListener('click', () => {
    // Versucht lokale Daten zu lesen (file:// Kontext)
    try {
        // Trick: Window.name für Cross-Origin (funktioniert oft)
        const localDataStr = localStorage.getItem('bewerbungen') || 
                           sessionStorage.getItem('bewerbungen') ||
                           window.name;
        
        if (localDataStr && localDataStr !== '[]') {
            const localData = JSON.parse(localDataStr);
            data = localData;
            saveData();
            render();
            window.name = ''; // Cleanup
            alert('✅ Migration erfolgreich! ' + data.length + ' Firmen übertragen.');
        } else {
            alert('❌ Keine lokalen Daten gefunden. Exportiere lokal zuerst!');
        }
    } catch (e) {
        alert('❌ Migration fehlgeschlagen. Exportiere als JSON und importiere.');
    }
});

document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bewerbungen-${new Date().toLocaleDateString('de-DE')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});


render();




