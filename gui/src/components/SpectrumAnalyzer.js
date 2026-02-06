/**
 * Spectrum Analyzer Component
 * Real-time RF spectrum visualization
 */

class SpectrumAnalyzer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scanning = false;
        this.frequency = 2.4;
        this.data = [];
        this.animationId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    start() {
        this.scanning = true;
        this.fetchData();
        this.animate();
    }

    stop() {
        this.scanning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    setFrequency(freq) {
        this.frequency = freq;
        fetch('/api/spectrum/frequency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frequency: freq })
        });
    }

    async fetchData() {
        if (!this.scanning) return;
        
        try {
            const response = await fetch('/api/spectrum/data');
            this.data = await response.json();
        } catch (err) {
            // Generate simulated data if backend not available
            this.generateSimulatedData();
        }
        
        setTimeout(() => this.fetchData(), 100);
    }

    generateSimulatedData() {
        this.data = [];
        const center = this.frequency;
        const span = 0.1;
        
        for (let i = 0; i < 1024; i++) {
            const freq = center - span/2 + (span * i / 1024);
            let amplitude = -100 + Math.random() * 20;
            
            // Add peaks at common frequencies
            if (Math.abs(freq - 2.412) < 0.01) amplitude += 40;
            if (Math.abs(freq - 2.437) < 0.01) amplitude += 35;
            if (Math.abs(freq - 2.462) < 0.01) amplitude += 30;
            if (Math.random() > 0.98) amplitude += 25;
            
            this.data.push({ frequency: freq, amplitude: Math.min(0, amplitude) });
        }
    }

    animate() {
        if (!this.scanning) return;
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    draw() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        
        // Draw spectrum
        if (this.data.length > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < this.data.length; i++) {
                const x = (i / this.data.length) * width;
                const y = height - ((this.data[i].amplitude + 100) / 100) * height * 0.8 - height * 0.1;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Draw fill
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            ctx.fill();
            
            // Draw peaks
            const peaks = this.findPeaks();
            ctx.fillStyle = '#ff00ff';
            peaks.forEach(peak => {
                const x = (peak.index / this.data.length) * width;
                const y = height - ((peak.amplitude + 100) / 100) * height * 0.8 - height * 0.1;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    findPeaks() {
        const peaks = [];
        for (let i = 1; i < this.data.length - 1; i++) {
            if (this.data[i].amplitude > this.data[i-1].amplitude && 
                this.data[i].amplitude > this.data[i+1].amplitude &&
                this.data[i].amplitude > -60) {
                peaks.push({ index: i, ...this.data[i] });
            }
        }
        return peaks.slice(0, 5);
    }

    getPeakFrequency() {
        if (this.data.length === 0) return '--';
        const peak = this.data.reduce((max, d) => d.amplitude > max.amplitude ? d : max);
        return peak.frequency.toFixed(3) + ' GHz';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpectrumAnalyzer;
}
