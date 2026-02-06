/**
 * Council Panel Component
 * Manages 5-Key Council visualization and control
 */

class CouncilPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.council = {
            GHOST: { name: 'THE GHOST', active: false, color: '#00ffff', icon: '👻' },
            ARCHITECT: { name: 'THE ARCHITECT', active: false, color: '#ff00ff', icon: '🏛️' },
            MONK: { name: 'THE MONK', active: false, color: '#ffff00', icon: '🧘' },
            SHADOW: { name: 'THE SHADOW', active: false, color: '#ff6600', icon: '🌑' },
            OBSERVER: { name: 'THE OBSERVER', active: false, color: '#00ff00', icon: '👁️' }
        };
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="council-grid">
                ${Object.entries(this.council).map(([key, data]) => `
                    <div class="council-card ${data.active ? 'active' : ''}" data-key="${key}">
                        <div class="council-icon">${data.icon}</div>
                        <div class="council-name">${data.name}</div>
                        <div class="council-key">${key}</div>
                        <div class="council-status">
                            ${data.active ? '🟢 Active' : '🔴 Inactive'}
                        </div>
                        <div class="council-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${data.active ? 100 : 0}%; background: ${data.color}"></div>
                            </div>
                        </div>
                        <div class="council-actions">
                            <button class="btn-activate" data-key="${key}">
                                ${data.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn-test" data-key="${key}">Test</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    attachEventListeners() {
        this.container.querySelectorAll('.btn-activate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                this.toggleKey(key);
            });
        });

        this.container.querySelectorAll('.btn-test').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                this.testKey(key);
            });
        });
    }

    async toggleKey(key) {
        try {
            const response = await fetch('/api/council/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            
            const data = await response.json();
            this.council[key].active = data.active;
            this.render();
            this.attachEventListeners();
            
            if (window.nemo) {
                window.nemo.log(`${key} ${data.active ? 'activated' : 'deactivated'}`, 'success');
            }
        } catch (err) {
            console.error('Failed to toggle key:', err);
        }
    }

    async testKey(key) {
        try {
            const response = await fetch('/api/council/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            
            const data = await response.json();
            alert(`${this.council[key].name} Test Result:\n${data.result}`);
            
            if (window.nemo) {
                window.nemo.log(`${key} test complete`, 'info');
            }
        } catch (err) {
            console.error('Failed to test key:', err);
        }
    }

    updateStatus(key, active) {
        if (this.council[key]) {
            this.council[key].active = active;
            this.render();
            this.attachEventListeners();
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CouncilPanel;
}
