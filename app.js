const STORAGE_KEY = "tonight_reception_v1";

const BOX_FEE = 10000;
const ENTRY_FEE = 1000;
const DRINK_FEE = 500;
const CASH_DENOMINATIONS = [
  10000,
  5000,
  1000,
  500,
  100,
  50,
  10
];

const screen = document.getElementById("app");
const backBtn = document.getElementById("backBtn");

let pageHistory = [];

let state = loadState();

function createInitialState() {
  return {
    initialized: false,

    startCash: 0,

    startCashBreakdown: {},

    drinkTickets: 0,

    totals: {
      general: 0,
      tmp: 0,
      grossEntrance: 0,
      totalDiscount: 0
    },

    receptionHistory: [],

    currentReception: null
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(raw);

    parsed.totals = {
      general: 0,
      tmp: 0,
      grossEntrance: 0,
      totalDiscount: 0,
      ...(parsed.totals || {})
    };

    parsed.receptionHistory =
      parsed.receptionHistory || [];

    parsed.startCashBreakdown =
      parsed.startCashBreakdown || {};

    return parsed;
  } catch {
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function navigate(renderFunc) {
  pageHistory.push(renderFunc);

  renderFunc();

  updateBackButton();
}

function back() {
  if (pageHistory.length <= 1) {
    return;
  }

  pageHistory.pop();

  const previous =
    pageHistory[pageHistory.length - 1];

  previous();

  updateBackButton();
}

function updateBackButton() {
  if (pageHistory.length <= 1) {
    backBtn.classList.add("hidden");
  } else {
    backBtn.classList.remove("hidden");
  }
}

backBtn.addEventListener(
  "click",
  back
);

function tallyString(count) {

  let result = "";

  const groups = Math.floor(count / 5);

  for (let i = 0; i < groups; i++) {
    result += "||||/ ";
  }

  result += "|".repeat(count % 5);

  return result;
}

function getTotalPeople() {

  return (
    state.totals.general +
    state.totals.tmp
  );
}

function getLastReception() {

  if (
    state.receptionHistory.length === 0
  ) {
    return null;
  }

  return state.receptionHistory[0];
}

function formatMoney(value) {

  return value.toLocaleString("ja-JP");
}

function formatSignedMoney(value) {

  const sign =
    value >= 0
      ? "+"
      : "-";

  return `${sign}¥${formatMoney(Math.abs(value))}`;
}

function getReceptionTotal() {

  return state.receptionHistory
    .reduce(
      (sum, reception) =>
        sum + reception.totalAmount,
      0
    );
}

function renderCashBreakdown(breakdown) {

  const hasBreakdown =
    CASH_DENOMINATIONS
      .some(
        value =>
          Number(breakdown[value] || 0) > 0
      );

  if (!hasBreakdown) {
    return `
      <div class="sub-text">
        金種別枚数は保存されていません
      </div>
    `;
  }

  return CASH_DENOMINATIONS
    .map(
      value => {

        const count =
          Number(
            breakdown[value] || 0
          );

        return `
          <div class="row compact-row">
            <span>
              ${formatMoney(value)}円
            </span>
            <strong>
              ${count}枚
            </strong>
          </div>
        `;
      }
    )
    .join("");
}

function renderSetup() {

  screen.innerHTML = `
  
  <div class="card">

    <div class="card-title">
      会計準備
    </div>

    ${renderCashInputs()}

    <div class="row">
      <label>
        ドリンクチケット枚数
      </label>

      <input
        id="ticketCount"
        type="number"
        value="${
          state.drinkTickets
        }"
      >
    </div>

    <button
      class="btn btn-primary btn-large"
      id="startEventBtn"
    >
      受付開始
    </button>

  </div>
  `;

  document
    .getElementById("startEventBtn")
    .addEventListener(
      "click",
      startEvent
    );
}

function renderCashInputs(breakdown = {}) {

  return CASH_DENOMINATIONS
    .map(
      value => {

        const count =
          Number(
            breakdown[value] || 0
          );

        return `
      <div class="row">

        <label>
          ${value.toLocaleString()}円
        </label>

        <input
          type="number"
          min="0"
          value="${count}"
          data-cash="${value}"
        >

      </div>
    `;
      }
    )
    .join("");
}

function readCashInputState() {

  let total = 0;
  const startCashBreakdown = {};

  document
    .querySelectorAll("[data-cash]")
    .forEach(input => {

      const value =
        Number(
          input.dataset.cash
        );

      const count =
        Number(
          input.value || 0
        );

      total += value * count;
      startCashBreakdown[value] = count;
    });

  return {
    total,
    startCashBreakdown
  };
}

function startEvent() {

  const cashState =
    readCashInputState();

  state.startCash = cashState.total;
  state.startCashBreakdown =
    cashState.startCashBreakdown;

  state.drinkTickets =
    Number(
      document.getElementById(
        "ticketCount"
      ).value
    );

  state.initialized = true;

  saveState();

  navigate(renderHome);
}

function renderEditStartCash() {

  screen.innerHTML = `

  <div class="card">

    <div class="card-title">
      初期金庫額を編集
    </div>

    ${renderCashInputs(
      state.startCashBreakdown
    )}

    <button
      class="btn btn-primary btn-large"
      id="saveStartCashBtn"
    >
      保存
    </button>

  </div>
  `;

  document
    .getElementById(
      "saveStartCashBtn"
    )
    .onclick = () => {

      const cashState =
        readCashInputState();

      state.startCash =
        cashState.total;

      state.startCashBreakdown =
        cashState.startCashBreakdown;

      saveState();

      navigate(renderHome);
    };
}

function renderEditDrinkTickets() {

  screen.innerHTML = `

  <div class="card">

    <div class="card-title">
      ドリチケ枚数を編集
    </div>

    <div class="row">
      <label>
        ドリンクチケット残数
      </label>

      <input
        id="editTicketCount"
        type="number"
        min="0"
        value="${state.drinkTickets}"
      >
    </div>

    <button
      class="btn btn-primary btn-large"
      id="saveDrinkTicketsBtn"
    >
      保存
    </button>

  </div>
  `;

  document
    .getElementById(
      "saveDrinkTicketsBtn"
    )
    .onclick = () => {

      state.drinkTickets =
        Number(
          document
            .getElementById(
              "editTicketCount"
            )
            .value ||
            0
        );

      saveState();

      navigate(renderHome);
    };
}

function renderHome() {

  const last =
    getLastReception();

  screen.innerHTML = `
  
  <div class="card">

    <div class="card-title">
      来場状況
    </div>

    <div class="stats-grid">

      <div class="stat">

        <div class="stat-label">
          一般
        </div>

        <div class="stat-value">
          ${state.totals.general}
        </div>

        <div class="tally">
          ${tallyString(
            state.totals.general
          )}
        </div>

      </div>

      <div class="stat">

        <div class="stat-label">
          TMP
        </div>

        <div class="stat-value">
          ${state.totals.tmp}
        </div>

        <div class="tally">
          ${tallyString(
            state.totals.tmp
          )}
        </div>

      </div>

      <div class="stat">

        <div class="stat-label">
          合計
        </div>

        <div class="stat-value">
          ${getTotalPeople()}
        </div>

      </div>

    </div>

    <button
      class="btn btn-secondary"
      id="editDrinkTicketsBtn"
    >
      ドリチケ枚数を編集
    </button>

  </div>

  <div class="card">

    <div class="card-title">
      直近受付
    </div>

    ${
      last
        ? `
        <div>
          ${last.timestamp}
        </div>

        <div>
          一般 ${last.general}名
        </div>

        <div>
          TMP ${last.tmp}名
        </div>
      `
        : "まだ受付履歴はありません"
    }

  </div>

  <div class="card">

    <div class="row">

      <div>
        ドリチケ残数
      </div>

      <div>
        ${state.drinkTickets}
      </div>

    </div>

  </div>

  <div class="card">

    <div class="card-title">
      初期金庫額
    </div>

    <div class="row">

      <span>
        合計
      </span>

      <strong>
        ¥${formatMoney(state.startCash)}
      </strong>

    </div>

    ${renderCashBreakdown(
      state.startCashBreakdown
    )}

    <br>

    <button
      class="btn btn-secondary"
      id="editStartCashBtn"
    >
      初期金庫額を編集
    </button>

  </div>

  <button
    class="btn btn-primary btn-large"
    id="newReceptionBtn"
  >
    新規受付
  </button>

  <br><br>

  <button
    class="btn btn-secondary btn-large"
    id="historyBtn"
  >
    履歴
  </button>

  <br><br>

  <button
    class="btn btn-secondary btn-large"
    id="resultBtn"
  >
    リザルト
  </button>

  <br><br>

  <button
    class="btn btn-danger btn-large"
    id="clearEventBtn"
  >
    イベントデータを一括削除
  </button>
  `;

  document
    .getElementById(
      "newReceptionBtn"
    )
    .addEventListener(
      "click",
      () => navigate(
        renderReceptionInput
      )
    );

  document
    .getElementById(
      "historyBtn"
    )
    .addEventListener(
      "click",
      () => navigate(
        renderHistory
      )
    );

  document
    .getElementById(
      "resultBtn"
    )
    .addEventListener(
      "click",
      () => navigate(
        renderResult
      )
    );

  document
    .getElementById(
      "editStartCashBtn"
    )
    .addEventListener(
      "click",
      () => navigate(
        renderEditStartCash
      )
    );

  document
    .getElementById(
      "editDrinkTicketsBtn"
    )
    .addEventListener(
      "click",
      () => navigate(
        renderEditDrinkTickets
      )
    );

  document
    .getElementById(
      "clearEventBtn"
    )
    .addEventListener(
      "click",
      clearEventData
    );
}

function renderReceptionInput() {

  screen.innerHTML = `

  <div class="card reception-card">

    <div class="card-title">
      新規受付
    </div>

    <div class="reception-counter-list">

      <div class="counter-row">

        <div class="counter-label">
          <span>一般</span>
          <small>通常来場者</small>
        </div>

        <div class="counter">

          <button
            class="counter-btn"
            id="generalMinus"
          >
            −
          </button>

          <div
            class="counter-value"
            id="generalCount"
          >
            0
          </div>

          <button
            class="counter-btn"
            id="generalPlus"
          >
            +
          </button>

        </div>

      </div>

      <div class="counter-row">

        <div class="counter-label">
          <span>TMP</span>
          <small>関係者・招待</small>
        </div>

        <div class="counter">

          <button
            class="counter-btn"
            id="tmpMinus"
          >
            −
          </button>

          <div
            class="counter-value"
            id="tmpCount"
          >
            0
          </div>

          <button
            class="counter-btn"
            id="tmpPlus"
          >
            +
          </button>

        </div>

      </div>

    </div>

    <div class="reception-total">
      <span>合計</span>
      <strong id="receptionTotalCount">0名</strong>
    </div>

    <button
      class="btn btn-primary btn-large"
      id="goDiscount"
    >
      次へ
    </button>

  </div>
  `;

  let general = 0;
  let tmp = 0;

  const refresh = () => {

    document.getElementById(
      "generalCount"
    ).textContent = general;

    document.getElementById(
      "tmpCount"
    ).textContent = tmp;

    document.getElementById(
      "receptionTotalCount"
    ).textContent =
      `${general + tmp}名`;
  };

  refresh();

  document
    .getElementById("generalPlus")
    .onclick = () => {
      general++;
      refresh();
    };

  document
    .getElementById("generalMinus")
    .onclick = () => {
      if (general > 0) {
        general--;
        refresh();
      }
    };

  document
    .getElementById("tmpPlus")
    .onclick = () => {
      tmp++;
      refresh();
    };

  document
    .getElementById("tmpMinus")
    .onclick = () => {
      if (tmp > 0) {
        tmp--;
        refresh();
      }
    };

  document
    .getElementById("goDiscount")
    .onclick = () => {

      const total =
        general + tmp;

      if (total === 0) {

        alert(
          "人数を入力してください"
        );

        return;
      }

      state.currentReception = {

        general,
        tmp,

        guests: []
      };

      for (
        let i = 0;
        i < general;
        i++
      ) {

        state.currentReception
          .guests.push({

          type: "general",

          discount: 0

        });
      }

      for (
        let i = 0;
        i < tmp;
        i++
      ) {

        state.currentReception
          .guests.push({

          type: "tmp",

          discount: 0

        });
      }

      navigate(
        renderDiscountScreen
      );
    };
}

function renderDiscountScreen() {

  const guests =
    state.currentReception.guests;

  let html = `

  <div class="card">

    <div class="card-title">
      割引設定
    </div>
  `;

  guests.forEach(
    (guest,index) => {

      html += `

      <div class="discount-card">

        <div class="discount-card-header">

          <strong>

            来場者 ${
              index + 1
            }

          </strong>

          <span class="guest-type">

            ${
              guest.type ===
              "general"
                ? "一般"
                : "TMP"
            }

          </span>

        </div>

        <div
          class="discount-options"
        >

          <div
            class="discount-option"
          >

            <button
              class="${guest.discount === 0 ? "active" : ""}"
              onclick="
              setDiscount(
              ${index},
              0
              )"
            >

              通常

            </button>

          </div>

          <div
            class="discount-option"
          >

            <button
              class="${guest.discount === 500 ? "active" : ""}"
              onclick="
              setDiscount(
              ${index},
              500
              )"
            >

              -500

            </button>

          </div>

          <div
            class="discount-option"
          >

            <button
              class="${guest.discount === 1000 ? "active" : ""}"
              onclick="
              setDiscount(
              ${index},
              1000
              )"
            >

              -1000

            </button>

          </div>

        </div>

        <div class="discount-current">

          現在:
          ¥${guest.discount}

        </div>

      </div>
      `;
    }
  );

  html += `

    <button
      class="
      btn
      btn-primary
      btn-large
      "
      id="proceedPayment"
    >

      会計へ

    </button>

  </div>
  `;

  screen.innerHTML = html;

  document
    .getElementById(
      "proceedPayment"
    )
    .onclick = () =>
      navigate(
        renderPaymentScreen
      );
}

function setDiscount(
  index,
  discount
) {

  state
    .currentReception
    .guests[index]
    .discount = discount;

  renderDiscountScreen();
}

function renderPaymentScreen() {

  const guests =
    state.currentReception.guests;

  let total = 0;

  guests.forEach(
    guest => {

      total +=

        ENTRY_FEE +

        DRINK_FEE -

        guest.discount;
    }
  );

  state.currentReception
    .totalAmount = total;

  screen.innerHTML = `

  <div class="card payment-card">

    <div class="card-title">
      お支払い金額
    </div>

    <div
      class="money-display"
    >

      <div class="amount">

        ¥${formatMoney(
          total
        )}

      </div>

    </div>

    <div class="form-row">

      <label>

        預かり金額

      </label>

      <input
        id="paidAmount"
        type="number"
      >

    </div>

    <button
      class="
      btn
      btn-primary
      btn-large
      "
      id="calcChangeBtn"
    >

      次へ

    </button>

  </div>
  `;

  document
    .getElementById(
      "calcChangeBtn"
    )
    .onclick = () => {

      const paid = Number(
        document
          .getElementById(
            "paidAmount"
          )
          .value
      );

      if (
        paid < total
      ) {

        alert(
          "預かり金額不足"
        );

        return;
      }

      state.currentReception
        .paidAmount = paid;

      state.currentReception
        .change =
          paid - total;

      navigate(
        renderChecklist
      );
    };
}

function renderChecklist() {

  const reception =
    state.currentReception;

  screen.innerHTML = `

  <div class="card checklist-card">

    <div class="card-title">
      受付確認
    </div>

    <div class="money-display">

      <div class="label">
        お釣り
      </div>

      <div class="amount">

        ¥${formatMoney(
          reception.change
        )}

      </div>

    </div>

    <div class="checklist">

      <label>

        <input
          type="checkbox"
          id="checkTicket"
        >

        <span>ドリンクチケットを渡した</span>

      </label>

      <label>

        <input
          type="checkbox"
          id="checkMoney"
        >

        <span>お金を受け取った</span>

      </label>

      <label>

        <input
          type="checkbox"
          id="checkChange"
        >

        <span>お釣りを渡した</span>

      </label>

    </div>

    <br>

    <button
      class="
      btn
      btn-primary
      btn-large
      "
      id="completeReceptionBtn"
    >

      受付完了

    </button>

  </div>
  `;

  document
    .getElementById(
      "completeReceptionBtn"
    )
    .onclick =
      completeReception;
}

function completeReception() {

  const ticket =
    document.getElementById(
      "checkTicket"
    ).checked;

  const money =
    document.getElementById(
      "checkMoney"
    ).checked;

  const change =
    document.getElementById(
      "checkChange"
    ).checked;

  if (
    !ticket ||
    !money ||
    !change
  ) {

    alert(
      "全項目確認してください"
    );

    return;
  }

  const reception =
    state.currentReception;

  const grossEntrance =
    reception.guests.length *
    (ENTRY_FEE + DRINK_FEE);

  const totalDiscount =
    reception.guests.reduce(
      (sum, guest) =>
        sum + guest.discount,
      0
    );

  const timestamp =
    new Date()
      .toLocaleString(
        "ja-JP"
      );

  const historyEntry = {

    id:
      Date.now(),

    timestamp,

    general:
      reception.general,

    tmp:
      reception.tmp,

    guests:
      structuredClone(
        reception.guests
      ),

    totalAmount:
      reception.totalAmount,

    grossEntrance,

    totalDiscount,

    paidAmount:
      reception.paidAmount,

    change:
      reception.change
  };

  state.receptionHistory
    .unshift(
      historyEntry
    );

  state.totals.general +=
    reception.general;

  state.totals.tmp +=
    reception.tmp;

  state.totals.grossEntrance +=
    grossEntrance;

  state.totals.totalDiscount +=
    totalDiscount;

  state.drinkTickets -=

    (
      reception.general +
      reception.tmp
    );

  saveState();

  renderSuccessScreen();
}

function renderSuccessScreen() {

  const latest =
    state.receptionHistory[0];

  screen.innerHTML = `

  <div
    class="
    success-screen
    "
  >

    <div
      class="
      success-icon
      "
    >

      ✓

    </div>

    <div
      class="
      success-text
      "
    >

      受付完了

    </div>

    <br>

    <div>

      ${latest.timestamp}

    </div>

    <br>

    <div>

      一般
      ${latest.general}名

    </div>

    <div>

      TMP
      ${latest.tmp}名

    </div>

  </div>
  `;

  setTimeout(
    () => {

      state.currentReception =
        null;

      navigate(
        renderHome
      );

    },
    3000
  );
}

function renderHistory() {

  let html = `

  <div class="card">

    <div class="card-title">

      受付履歴

    </div>
  `;

  if (
    state.receptionHistory
      .length === 0
  ) {

    html += `
      履歴はありません
    `;
  } else {

    html += `

      <button
        class="
        btn
        btn-danger
        "
        id="clearEventBtn"
      >

        イベントデータを一括削除

      </button>

      <br><br>
    `;
  }

  state.receptionHistory
    .forEach(
      entry => {

        html += `

        <div
          class="
          history-item
          "
        >

          <div
            class="
            history-time
            "
          >

            ${
              entry.timestamp
            }

          </div>

          <div>

            一般
            ${
              entry.general
            }名

          </div>

          <div>

            TMP
            ${
              entry.tmp
            }名

          </div>

          <div>

            ¥${formatMoney(
              entry.totalAmount
            )}

          </div>

          <br>

          <button
            class="
            btn
            btn-secondary
            "
            onclick="
            deleteHistory(
            ${
              entry.id
            }
            )
            "
          >

            削除

          </button>

        </div>
        `;
      }
    );

  html += `
  </div>
  `;

  screen.innerHTML = html;

  const clearEventBtn =
    document.getElementById(
      "clearEventBtn"
    );

  if (clearEventBtn) {

    clearEventBtn.onclick =
      clearEventData;
  }
}

function deleteHistory(id) {

  const target =
    state.receptionHistory
      .find(
        x =>
          x.id === id
      );

  if (!target) return;

  if (
    !confirm(
      "削除しますか？"
    )
  ) {
    return;
  }

  state.totals.general -=
    target.general;

  state.totals.tmp -=
    target.tmp;

  state.totals.grossEntrance -=
    target.grossEntrance ||
    (
      (target.general + target.tmp) *
      (ENTRY_FEE + DRINK_FEE)
    );

  state.totals.totalDiscount -=
    target.totalDiscount ||
    0;

  state.drinkTickets +=

    target.general +
    target.tmp;

  state.receptionHistory =

    state.receptionHistory
      .filter(
        x =>
          x.id !== id
      );

  saveState();

  renderHistory();
}

function clearEventData() {

  if (
    !confirm(
      "イベントデータをすべて削除しますか？\n受付履歴、初期金庫額、ドリチケ枚数も削除されます。"
    )
  ) {
    return;
  }

  state = createInitialState();
  saveState();

  pageHistory = [];
  navigate(renderSetup);
}

function renderResult() {

  const people =

    state.totals.general +

    state.totals.tmp;

  const grossEntrance =
    state.receptionHistory
      .reduce(
        (sum, r) =>
          sum +
          (
            r.grossEntrance ||
            (
              (r.general + r.tmp) *
              (ENTRY_FEE + DRINK_FEE)
            )
          ),
        0
      );

  const totalDiscount =
    state.receptionHistory
      .reduce(
        (sum, r) =>
          sum +
          (
            r.totalDiscount ||
            0
          ),
        0
      );

  const entranceIncome =

    grossEntrance -

    totalDiscount;

  const drinkTicketAmount =

    people *

    DRINK_FEE;

  const profitTargetIncome =

    entranceIncome -

    drinkTicketAmount;

  const profit =

    profitTargetIncome -

    BOX_FEE;

  const theoreticalCash =

    state.startCash +

    getReceptionTotal();

  const cashIncrease =
    theoreticalCash -
    state.startCash;

  screen.innerHTML = `

  <div class="card">

    <div class="card-title">

      イベント結果

    </div>

    <div class="stats-grid">

      <div class="stat">

        <div class="stat-label">
          一般
        </div>

        <div class="stat-value">
          ${state.totals.general}
        </div>

      </div>

      <div class="stat">

        <div class="stat-label">
          TMP
        </div>

        <div class="stat-value">
          ${state.totals.tmp}
        </div>

      </div>

      <div class="stat">

        <div class="stat-label">
          合計
        </div>

        <div class="stat-value">
          ${people}
        </div>

      </div>

    </div>

  </div>

  <div class="card">

    <div class="row">

      <span>
        徴収額
      </span>

      <strong>

        ¥${formatMoney(
          entranceIncome
        )}

      </strong>

    </div>

    <div class="row">

      <span>
        総割引額
      </span>

      <strong>

        ¥${formatMoney(
          totalDiscount
        )}

      </strong>

    </div>

    <div class="row">

      <span>
        ドリチケ預かり分
      </span>

      <strong>

        ¥${formatMoney(
          drinkTicketAmount
        )}

      </strong>

    </div>

    <div class="row">

      <span>
        利益対象収入
      </span>

      <strong>

        ¥${formatMoney(
          profitTargetIncome
        )}

      </strong>

    </div>

    <div class="row">

      <span>
        利益
      </span>

      <strong>

        ¥${formatMoney(
          profit
        )}

      </strong>

    </div>

  </div>

  <div class="card">

    <div class="row">

      <span>
        理論金庫額
      </span>

      <strong>

        ¥${formatMoney(
          theoreticalCash
        )}
        (${formatSignedMoney(
          cashIncrease
        )})

      </strong>

    </div>

  </div>

  <button
    class="
    btn
    btn-secondary
    btn-large
    "
    id="cashCheckBtn"
  >

    金庫照合

  </button>

  <br><br>

  <button
    class="
    btn
    btn-danger
    btn-large
    "
    id="clearEventBtn"
  >

    イベントデータを一括削除

  </button>

  `;

  document
    .getElementById(
      "cashCheckBtn"
    )
    .onclick =
      () =>
      navigate(
        renderCashCheck
      );

  document
    .getElementById(
      "clearEventBtn"
    )
    .onclick =
      clearEventData;
}

function renderCashCheck() {

  screen.innerHTML = `

  <div class="card">

    <div class="card-title">

      金庫照合

    </div>

      10000円
      <input
      id="c10000"
      type="number">

      5000円
      <input
      id="c5000"
      type="number">

      1000円
      <input
      id="c1000"
      type="number">

      500円
      <input
      id="c500"
      type="number">

      100円
      <input
      id="c100"
      type="number">

      50円
      <input
      id="c50"
      type="number">

      10円
      <input
      id="c10"
      type="number">

      <br><br>

      <button
      id="calcCashBtn"
      class="
      btn
      btn-primary
      btn-large
      ">
      照合
      </button>

  </div>
  `;

  document
    .getElementById(
      "calcCashBtn"
    )
    .onclick =
      calculateCashCheck;
}

function calculateCashCheck() {

  const bills = [
    10000,
    5000,
    1000,
    500,
    100,
    50,
    10
  ];

  const actualCash =
    bills.reduce(
      (sum, value) =>
        sum +
        value *
        Number(
          document
            .getElementById(
              `c${value}`
            )
            .value ||
            0
        ),
      0
    );

  const theoreticalCash =
    state.startCash +
    state.receptionHistory
      .reduce(
        (sum, r) =>
          sum + r.totalAmount,
        0
      );

  const diff =
    actualCash - theoreticalCash;

  alert(
    `実金庫額: ¥${formatMoney(actualCash)}\n` +
    `理論金庫額: ¥${formatMoney(theoreticalCash)}\n` +
    `差額: ¥${formatMoney(diff)}`
  );
}

if (
  state.initialized
) {

  navigate(
    renderHome
  );

} else {

  navigate(
    renderSetup
  );
}
