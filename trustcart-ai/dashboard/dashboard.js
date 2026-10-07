/**
 * TrustCart AI - Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation tabs
  const navItems = document.querySelectorAll('.tc-dash-nav .nav-item');
  const tabPanes = document.querySelectorAll('.tc-tab-pane');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      navItems.forEach(n => n.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(`tab-${target}`);
      if (pane) pane.classList.add('active');

      if (target === 'overview') loadOverviewData();
      if (target === 'history') loadHistoryTable();
      if (target === 'saved') loadSavedTable();
    });
  });

  // KPI elements
  const kpiTotal = document.getElementById('kpi-total-analyzed');
  const kpiAvg = document.getElementById('kpi-avg-score');
  const kpiHighRisk = document.getElementById('kpi-high-risk');
  const kpiSaved = document.getElementById('kpi-saved-count');
  const overviewTbody = document.getElementById('overview-recent-tbody');

  // History & Saved tables
  const historyTbody = document.getElementById('history-table-body');
  const savedTbody = document.getElementById('saved-table-body');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const btnCompareSelected = document.getElementById('btn-compare-selected');
  const compareContainer = document.getElementById('compare-container');
  const btnLoadCompareSamples = document.getElementById('btn-load-compare-samples');
  const btnSeedSampleHistory = document.getElementById('btn-seed-sample-history');

  // Settings
  const settingsForm = document.getElementById('settings-form');
  const settingEndpoint = document.getElementById('setting-endpoint');
  const settingNotifications = document.getElementById('setting-notifications');
  const settingDemoMode = document.getElementById('setting-demomode');
  const settingsSavedIndicator = document.getElementById('settings-saved-indicator');

  let selectedProductIds = new Set();

  function getRiskPillClass(level) {
    if (level === 'LOW RISK') return 'low';
    if (level === 'MODERATE RISK') return 'mod';
    if (level === 'HIGH RISK') return 'high';
    return 'vhigh';
  }

  function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  // Load Overview
  async function loadOverviewData() {
    const history = await TrustCartStorage.getAnalysisHistory();
    const saved = await TrustCartStorage.getSavedProducts();

    kpiTotal.textContent = history.length;
    kpiSaved.textContent = saved.length;

    if (history.length > 0) {
      const avg = Math.round(history.reduce((acc, h) => acc + (h.trustScore || 0), 0) / history.length);
      kpiAvg.textContent = `${avg} / 100`;

      const highRiskCount = history.filter(h => (h.trustScore || 0) < 60).length;
      kpiHighRisk.textContent = highRiskCount;

      overviewTbody.innerHTML = '';
      history.slice(0, 5).forEach(item => {
        const tr = document.createElement('tr');
        const pillClass = getRiskPillClass(item.riskLevel);
        const color = getScoreColor(item.trustScore);
        const dateStr = new Date(item.analyzedAt).toLocaleDateString();

        tr.innerHTML = `
          <td><strong>${item.productTitle || 'Product'}</strong></td>
          <td><code>${item.domain || 'store'}</code></td>
          <td>${item.currentPriceText || '—'}</td>
          <td><span class="tc-score-badge" style="color: ${color}">${item.trustScore}</span></td>
          <td><span class="tc-pill ${pillClass}">${item.riskLevel}</span></td>
          <td>${dateStr}</td>
        `;
        overviewTbody.appendChild(tr);
      });
    } else {
      kpiAvg.textContent = '--';
      kpiHighRisk.textContent = '0';
      overviewTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 24px; text-align: center; color: #64748b;">No recent analyses yet. Click "Load Sample History" or analyze any store page.</td></tr>';
    }
  }

  // Load History Table
  async function loadHistoryTable() {
    const history = await TrustCartStorage.getAnalysisHistory();
    historyTbody.innerHTML = '';

    if (history.length === 0) {
      historyTbody.innerHTML = '<tr><td colspan="7" style="padding: 24px; text-align: center; color: #64748b;">No analysis history recorded yet.</td></tr>';
      return;
    }

    history.forEach(item => {
      const tr = document.createElement('tr');
      const pillClass = getRiskPillClass(item.riskLevel);
      const color = getScoreColor(item.trustScore);
      const dateStr = new Date(item.analyzedAt).toLocaleDateString();

      tr.innerHTML = `
        <td style="max-width: 240px; font-weight: 600;">${item.productTitle}</td>
        <td><code>${item.domain}</code></td>
        <td>${item.currentPriceText}</td>
        <td><strong style="color: ${color}">${item.trustScore} / 100</strong></td>
        <td><span class="tc-pill ${pillClass}">${item.riskLevel}</span></td>
        <td>${dateStr}</td>
        <td>
          <button class="tc-btn-subtle btn-inspect" data-id="${item.id}">View</button>
        </td>
      `;
      historyTbody.appendChild(tr);
    });

    historyTbody.querySelectorAll('.btn-inspect').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const record = history.find(h => h.id === id);
        if (record) {
          alert(`Analysis Summary for: ${record.productTitle}\n\nTrust Score: ${record.trustScore}/100 (${record.riskLevel})\n${record.fullAnalysis?.summary || ''}`);
        }
      });
    });
  }

  // Load Saved Table
  async function loadSavedTable() {
    const saved = await TrustCartStorage.getSavedProducts();
    savedTbody.innerHTML = '';
    selectedProductIds.clear();
    updateCompareButtonState();

    if (saved.length === 0) {
      savedTbody.innerHTML = '<tr><td colspan="7" style="padding: 24px; text-align: center; color: #64748b;">No saved products yet.</td></tr>';
      return;
    }

    saved.forEach(item => {
      const tr = document.createElement('tr');
      const pillClass = getRiskPillClass(item.riskLevel);
      const color = getScoreColor(item.trustScore);

      tr.innerHTML = `
        <td><input type="checkbox" class="compare-chk" data-id="${item.id}"></td>
        <td style="font-weight: 600;">${item.productTitle}</td>
        <td><code>${item.domain}</code></td>
        <td>${item.currentPriceText}</td>
        <td><strong style="color: ${color}">${item.trustScore}</strong></td>
        <td><span class="tc-pill ${pillClass}">${item.riskLevel}</span></td>
        <td>
          <button class="tc-btn-danger btn-remove-saved" data-id="${item.id}" style="padding: 4px 8px; font-size: 11px;">Remove</button>
        </td>
      `;
      savedTbody.appendChild(tr);
    });

    savedTbody.querySelectorAll('.compare-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = chk.dataset.id;
        if (chk.checked) selectedProductIds.add(id);
        else selectedProductIds.delete(id);
        updateCompareButtonState();
      });
    });

    savedTbody.querySelectorAll('.btn-remove-saved').forEach(btn => {
      btn.addEventListener('click', async () => {
        await TrustCartStorage.removeSavedProduct(btn.dataset.id);
        loadSavedTable();
      });
    });
  }

  function updateCompareButtonState() {
    btnCompareSelected.textContent = `Compare Selected (${selectedProductIds.size})`;
    btnCompareSelected.disabled = selectedProductIds.size < 2;
  }

  // Side-by-Side Comparison Renderer
  function renderComparison(products) {
    if (!products || products.length < 2) return;

    let tableHtml = `
      <table class="tc-compare-matrix">
        <thead>
          <tr>
            <th>Risk Metric</th>
            ${products.map(p => `<th><strong>${p.productTitle || p.product?.title || 'Product'}</strong><br><span style="font-size: 11px; font-weight: normal; color: #64748b;">${p.domain || p.product?.domain || ''}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Trust Score (0–100)</td>
            ${products.map(p => {
              const score = p.trustScore;
              const color = getScoreColor(score);
              return `<td><span style="font-size: 20px; font-weight: 800; color: ${color}">${score}</span><br><span class="tc-pill ${getRiskPillClass(p.riskLevel)}">${p.riskLevel}</span></td>`;
            }).join('')}
          </tr>
          <tr>
            <td>Price Risk</td>
            ${products.map(p => {
              const cat = p.fullAnalysis?.riskCategories?.price || p.riskCategories?.price;
              const score = cat ? cat.score : '—';
              return `<td>${score} / 100</td>`;
            }).join('')}
          </tr>
          <tr>
            <td>Review Risk</td>
            ${products.map(p => {
              const cat = p.fullAnalysis?.riskCategories?.review || p.riskCategories?.review;
              const score = cat ? cat.score : '—';
              return `<td>${score} / 100</td>`;
            }).join('')}
          </tr>
          <tr>
            <td>Seller Risk</td>
            ${products.map(p => {
              const cat = p.fullAnalysis?.riskCategories?.seller || p.riskCategories?.seller;
              const score = cat ? cat.score : '—';
              return `<td>${score} / 100</td>`;
            }).join('')}
          </tr>
          <tr>
            <td>Policy Risk</td>
            ${products.map(p => {
              const cat = p.fullAnalysis?.riskCategories?.policy || p.riskCategories?.policy;
              const score = cat ? cat.score : '—';
              return `<td>${score} / 100</td>`;
            }).join('')}
          </tr>
          <tr>
            <td>Description Risk</td>
            ${products.map(p => {
              const cat = p.fullAnalysis?.riskCategories?.description || p.riskCategories?.description;
              const score = cat ? cat.score : '—';
              return `<td>${score} / 100</td>`;
            }).join('')}
          </tr>
        </tbody>
      </table>
    `;

    // Determine product with fewer risk indicators
    let bestProduct = products[0];
    for (const p of products) {
      if (p.trustScore > bestProduct.trustScore) {
        bestProduct = p;
      }
    }

    const recHtml = `
      <div class="tc-recom-box">
        <strong>Recommendation:</strong> "${bestProduct.productTitle || bestProduct.product?.title}" shows fewer risk indicators based on the available information.
      </div>
    `;

    compareContainer.innerHTML = tableHtml + recHtml;
  }

  // Compare Selected click
  btnCompareSelected.addEventListener('click', async () => {
    const saved = await TrustCartStorage.getSavedProducts();
    const toCompare = saved.filter(s => selectedProductIds.has(s.id));
    if (toCompare.length >= 2) {
      document.querySelector('[data-tab="compare"]').click();
      renderComparison(toCompare);
    }
  });

  // Load Comparison Samples
  btnLoadCompareSamples.addEventListener('click', () => {
    const sampleA = {
      productTitle: 'SoundPro Elite ANC Headphones',
      domain: 'discount-audio-deals.store',
      trustScore: 61,
      riskLevel: 'MODERATE RISK',
      riskCategories: {
        price: { score: 78 },
        review: { score: 55 },
        seller: { score: 62 },
        policy: { score: 35 },
        description: { score: 48 }
      }
    };

    const sampleB = {
      productTitle: 'Official Apex Sound Wireless 5.0 Headset',
      domain: 'authorized-electronics.com',
      trustScore: 84,
      riskLevel: 'LOW RISK',
      riskCategories: {
        price: { score: 32 },
        review: { score: 29 },
        seller: { score: 25 },
        policy: { score: 20 },
        description: { score: 18 }
      }
    };

    renderComparison([sampleA, sampleB]);
  });

  // Seed sample data for testing
  btnSeedSampleHistory.addEventListener('click', async () => {
    const samples = [
      {
        productTitle: 'Sony WH-1000XM5 Noise Cancelling Headphones',
        domain: 'amazon.in',
        currentPrice: 28990,
        originalPrice: 34990,
        currency: '₹',
        discountPercent: 17,
        rating: 4.6,
        reviewCount: 4210,
        seller: { name: 'Appario Retail Private Ltd', isVerified: true, rating: 4.8 }
      },
      {
        productTitle: 'Ultra Thin 100W Fast Solar Charger "Never Needs Power"',
        domain: 'gadget-deal-blaster.xyz',
        currentPrice: 499,
        originalPrice: 7999,
        currency: '₹',
        discountPercent: 94,
        rating: 5.0,
        reviewCount: 6,
        seller: { name: 'FastShip Outlet Direct', isVerified: false }
      },
      {
        productTitle: 'Puma Men Running Shoes Nitro 2',
        domain: 'flipkart.com',
        currentPrice: 3499,
        originalPrice: 6999,
        currency: '₹',
        discountPercent: 50,
        rating: 4.3,
        reviewCount: 890,
        seller: { name: 'RetailNet Official Store', isVerified: true, rating: 4.4 }
      }
    ];

    for (const sample of samples) {
      const scoring = window.TrustCartScoring.calculateTrustScore(sample);
      const analysis = {
        id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product: sample,
        trustScore: scoring.trustScore,
        riskLevel: scoring.riskLevel,
        riskCategories: scoring.riskCategories,
        summary: `Product exhibits ${scoring.riskLevel.toLowerCase()} signals based on publicly visible data.`,
        warnings: scoring.warnings,
        positiveSignals: scoring.positiveSignals,
        recommendations: scoring.recommendations,
        explanation: scoring.explanation,
        analyzedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)).toISOString(),
        isAIPowered: false
      };
      await TrustCartStorage.addAnalysisHistory(analysis);
      await TrustCartStorage.saveProduct(analysis);
    }

    loadOverviewData();
  });

  btnClearHistory.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear your entire scan history?')) {
      await TrustCartStorage.clearHistory();
      loadHistoryTable();
      loadOverviewData();
    }
  });

  // Settings Save
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await TrustCartStorage.updateSettings({
      apiEndpoint: settingEndpoint.value.trim(),
      notifications: settingNotifications.checked,
      demoMode: settingDemoMode.checked
    });
    settingsSavedIndicator.classList.remove('hidden');
    setTimeout(() => {
      settingsSavedIndicator.classList.add('hidden');
    }, 2500);
  });

  // Initial load
  const settings = await TrustCartStorage.getSettings();
  settingEndpoint.value = settings.apiEndpoint || 'http://localhost:3000/api/analyze';
  settingNotifications.checked = settings.notifications !== false;
  settingDemoMode.checked = Boolean(settings.demoMode);

  loadOverviewData();
});
