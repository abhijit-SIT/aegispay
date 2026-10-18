/**
 * AegisPay: AG Grid Cockpit Setup & Custom Cell Renderers
 * Centerpiece for AG Grid and PayPal+AI hackathon tracks
 */

let gridApi = null;
let currentTransactions = [];

function initAGGrid(transactions) {
  currentTransactions = transactions || [];
  const gridDiv = document.querySelector('#auditCockpitGrid');
  if (!gridDiv) return;

  const columnDefs = [
    {
      headerName: "Timestamp",
      field: "timestamp",
      width: 140,
      valueFormatter: params => {
        if (!params.value) return "";
        try {
          const d = new Date(params.value);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch (e) {
          return params.value;
        }
      },
      sort: 'desc'
    },
    {
      headerName: "AI Agent Identity",
      field: "agent_name",
      width: 220,
      cellRenderer: params => {
        if (!params.data) return "";
        const id = params.data.agent_id || "";
        let emoji = "🤖";
        if (id.includes("travel")) emoji = "✈️";
        else if (id.includes("procure")) emoji = "🛒";
        else if (id.includes("research")) emoji = "🔬";

        return `
          <div class="cell-agent">
            <span class="cell-agent-avatar">${emoji}</span>
            <div>
              <div class="cell-agent-name">${params.value || "Autonomous Bot"}</div>
            </div>
          </div>
        `;
      }
    },
    {
      headerName: "Natural Language Mission Intent",
      field: "intent",
      flex: 1,
      minWidth: 260,
      tooltipField: "intent",
      cellRenderer: params => {
        return `<div class="cell-intent" title="${params.value || ''}">${params.value || ''}</div>`;
      }
    },
    {
      headerName: "Merchant / Domain",
      field: "merchant",
      width: 170,
      cellRenderer: params => {
        if (!params.value) return "";
        const isBlocked = params.data && params.data.status === "BLOCKED_THREAT";
        const icon = isBlocked ? "⚠️" : "🌐";
        return `<span style="font-family: var(--font-mono); font-size: 0.78rem;">${icon} ${params.value}</span>`;
      }
    },
    {
      headerName: "Amount",
      field: "amount",
      width: 125,
      cellClass: "cell-amount",
      valueFormatter: params => {
        if (params.value === undefined || params.value === null) return "$0.00";
        return `$${Number(params.value).toFixed(2)} USD`;
      }
    },
    {
      headerName: "Enclave Decision",
      field: "status",
      width: 180,
      cellRenderer: params => {
        const status = params.value || "PENDING";
        if (status === "AUTO_APPROVED") {
          return `<span class="status-badge approved">✅ Auto Approved</span>`;
        } else if (status === "HITL_REQUIRED") {
          return `<span class="status-badge hitl">⚠️ HITL Required</span>`;
        } else if (status === "BLOCKED_THREAT") {
          return `<span class="status-badge blocked">🛑 Threat Blocked</span>`;
        } else if (status === "MANUALLY_APPROVED") {
          return `<span class="status-badge approved">👤 Human Approved</span>`;
        } else if (status === "REJECTED") {
          return `<span class="status-badge rejected">❌ Declined</span>`;
        }
        return `<span class="status-badge">${status}</span>`;
      }
    },
    {
      headerName: "Risk Score",
      field: "risk_score",
      width: 130,
      cellRenderer: params => {
        const score = params.value || 0;
        let tier = "low";
        let color = "#10B981";
        if (score >= 70) {
          tier = "high";
          color = "#EF4444";
        } else if (score >= 30) {
          tier = "medium";
          color = "#F59E0B";
        }
        return `
          <div class="cell-risk">
            <div class="risk-meter">
              <div class="risk-fill ${tier}" style="width: ${score}%;"></div>
            </div>
            <span class="risk-number" style="color: ${color};">${score}/100</span>
          </div>
        `;
      }
    },
    {
      headerName: "PayPal Order Ref",
      field: "paypal_order_id",
      width: 160,
      cellRenderer: params => {
        if (!params.value) return `<span style="color: var(--text-dim); font-size: 0.75rem;">None (Blocked)</span>`;
        return `
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--paypal-cyan); display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.004.425 5.412.072 5.892.072h7.616c3.42 0 6.096 1.34 6.784 4.887.487 2.51-.237 4.778-1.927 6.082 1.94.75 2.748 2.68 2.378 5.156-.47 3.12-2.88 5.14-6.335 5.14H7.076z"/></svg>
            ${params.value}
          </div>
        `;
      }
    },
    {
      headerName: "Audit / Actions",
      width: 170,
      sortable: false,
      filter: false,
      cellRenderer: params => {
        if (!params.data) return "";
        const data = params.data;
        const txId = data.id;

        if (data.status === "HITL_REQUIRED") {
          return `
            <div class="cell-actions">
              <button class="btn-cell btn-cell-approve" onclick="window.AegisApp.openHitlDrawer('${txId}')">Review</button>
              <button class="btn-cell btn-cell-audit" onclick="window.AegisApp.openAuditModal('${txId}')">Trace</button>
            </div>
          `;
        }
        return `
          <div class="cell-actions">
            <button class="btn-cell btn-cell-audit" onclick="window.AegisApp.openAuditModal('${txId}')">Audit Trace</button>
          </div>
        `;
      }
    }
  ];

  const gridOptions = {
    columnDefs: columnDefs,
    rowData: currentTransactions,
    rowHeight: 48,
    headerHeight: 42,
    animateRows: true,
    enableCellTextSelection: true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50],
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true
    },
    onGridReady: params => {
      gridApi = params.api;
      gridApi.sizeColumnsToFit();
    }
  };

  // AG Grid community v31+ support vs classic support
  if (typeof agGrid.createGrid === 'function') {
    gridApi = agGrid.createGrid(gridDiv, gridOptions);
  } else {
    new agGrid.Grid(gridDiv, gridOptions);
    gridApi = gridOptions.api;
  }

  // Window resize handler
  window.addEventListener('resize', () => {
    if (gridApi) {
      setTimeout(() => gridApi.sizeColumnsToFit(), 100);
    }
  });
}

function updateAGGridData(newTransactions) {
  currentTransactions = newTransactions;
  if (!gridApi) return;

  if (typeof gridApi.setGridOption === 'function') {
    gridApi.setGridOption('rowData', currentTransactions);
  } else if (typeof gridApi.setRowData === 'function') {
    gridApi.setRowData(currentTransactions);
  }
}

function prependTransactionToGrid(newTx) {
  currentTransactions.unshift(newTx);
  if (!gridApi) return;

  if (typeof gridApi.applyTransaction === 'function') {
    const res = gridApi.applyTransaction({ add: [newTx], addIndex: 0 });
    if (res && res.add && res.add.length > 0) {
      gridApi.flashCells({ rowNodes: res.add });
    }
  } else {
    updateAGGridData(currentTransactions);
  }
}

function filterGridStatus(statusCategory) {
  if (!gridApi) return;

  if (statusCategory === 'ALL') {
    gridApi.setColumnFilterModel('status', null).then(() => gridApi.onFilterChanged());
  } else if (statusCategory === 'APPROVED') {
    gridApi.setColumnFilterModel('status', {
      values: ['AUTO_APPROVED', 'MANUALLY_APPROVED']
    }).then(() => gridApi.onFilterChanged());
  } else if (statusCategory === 'HITL') {
    gridApi.setColumnFilterModel('status', {
      values: ['HITL_REQUIRED']
    }).then(() => gridApi.onFilterChanged());
  } else if (statusCategory === 'BLOCKED') {
    gridApi.setColumnFilterModel('status', {
      values: ['BLOCKED_THREAT', 'REJECTED']
    }).then(() => gridApi.onFilterChanged());
  }
}

function searchGrid(searchText) {
  if (!gridApi) return;
  gridApi.setQuickFilter(searchText);
}

function exportGridCsv() {
  if (!gridApi) return;
  gridApi.exportDataAsCsv({
    fileName: `AegisPay_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`
  });
}

window.AegisGrid = {
  initAGGrid,
  updateAGGridData,
  prependTransactionToGrid,
  filterGridStatus,
  searchGrid,
  exportGridCsv
};
