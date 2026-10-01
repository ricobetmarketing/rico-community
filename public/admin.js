(() => {

  const state = {
    admin: null,

    currentSection:
      "dashboard",

    dashboard: null,

    players: [],

    missions: [],

    rewards: [],

    drops: [],

    selectedPlayer: null
  };


  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(
      document.querySelectorAll(selector)
    );


  init();


  async function init() {

    bindGlobalEvents();

    const authenticated =
      await checkSession();

    if (authenticated) {
      showAdmin();
      await loadSection("dashboard");
    } else {
      showLogin();
    }

  }


  /* =====================================================
     AUTH
  ====================================================== */

  async function checkSession() {

    try {

      const response =
        await fetch(
          "/api/admin/me",
          {
            credentials:
              "same-origin"
          }
        );

      if (!response.ok) {
        return false;
      }

      const data =
        await response.json();

      if (!data.ok) {
        return false;
      }

      state.admin =
        data.admin;

      return true;

    } catch {

      return false;

    }

  }


  function showLogin() {

    $("#loginScreen")
      .classList.remove("hidden");

    $("#adminApp")
      .classList.add("hidden");

  }


  function showAdmin() {

    $("#loginScreen")
      .classList.add("hidden");

    $("#adminApp")
      .classList.remove("hidden");

    $("#sidebarAdminEmail")
      .textContent =
      state.admin?.email ||
      "Administrator";

  }


  async function login(event) {

    event.preventDefault();

    const email =
      $("#loginEmail")
        .value
        .trim();

    const password =
      $("#loginPassword")
        .value;

    const button =
      $("#loginButton");

    const errorBox =
      $("#loginError");

    errorBox
      .classList.add("hidden");

    button.disabled = true;
    button.textContent =
      "Signing in...";

    try {

      const data =
        await api(
          "/api/admin/login",
          {
            method: "POST",

            body:
              JSON.stringify({
                email,
                password
              })
          }
        );

      state.admin =
        data.admin;

      showAdmin();

      await loadSection(
        "dashboard"
      );

    } catch (error) {

      errorBox.textContent =
        error.message;

      errorBox
        .classList.remove(
          "hidden"
        );

    } finally {

      button.disabled = false;
      button.textContent =
        "Sign in";

    }

  }


  async function logout() {

    try {

      await api(
        "/api/admin/logout",
        {
          method: "POST"
        }
      );

    } catch {
      // Session will still be cleared visually.
    }

    state.admin = null;

    showLogin();

  }


  /* =====================================================
     NAVIGATION
  ====================================================== */

  const sectionMeta = {

    dashboard: {
      eyebrow:
        "OVERVIEW",

      title:
        "Dashboard"
    },

    players: {
      eyebrow:
        "PLAYER MANAGEMENT",

      title:
        "Players"
    },

    missions: {
      eyebrow:
        "ENGAGEMENT",

      title:
        "Missions"
    },

    rewards: {
      eyebrow:
        "LOYALTY",

      title:
        "Rewards"
    },

    drops: {
      eyebrow:
        "LIMITED EVENTS",

      title:
        "Reward Drops"
    },

    referrals: {
      eyebrow:
        "COMMUNITY",

      title:
        "Referrals"
    },

    leaderboard: {
      eyebrow:
        "RANKING",

      title:
        "Leaderboard"
    },

    messages: {
      eyebrow:
        "COMMUNICATION",

      title:
        "Messages"
    },

    appearance: {
      eyebrow:
        "MINI APP",

      title:
        "Appearance"
    },

    settings: {
      eyebrow:
        "CONFIGURATION",

      title:
        "Settings"
    }

  };


  async function openSection(
    section
  ) {

    state.currentSection =
      section;

    $$(".admin-section")
      .forEach(
        (element) =>
          element
            .classList
            .remove("active")
      );

    $$(".nav-link")
      .forEach(
        (element) =>
          element
            .classList
            .remove("active")
      );

    const target =
      $(
        `#section${
          section
            .charAt(0)
            .toUpperCase() +
          section.slice(1)
        }`
      );

    target?.classList.add(
      "active"
    );

    $(
      `.nav-link[data-section="${section}"]`
    )
      ?.classList
      .add("active");

    const meta =
      sectionMeta[section];

    if (meta) {

      $("#pageEyebrow")
        .textContent =
        meta.eyebrow;

      $("#pageTitle")
        .textContent =
        meta.title;

    }

    $("#sidebar")
      .classList.remove(
        "mobile-open"
      );

    await loadSection(
      section
    );

  }


  async function loadSection(
    section
  ) {

    try {

      switch (section) {

        case "dashboard":
          await loadDashboard();
          break;

        case "players":
          await loadPlayers();
          break;

        case "missions":
          await loadMissions();
          break;

        case "rewards":
          await loadRewards();
          break;

        case "drops":
          await loadDrops();
          break;

        case "referrals":
          renderReferralSummary();
          break;

        case "leaderboard":
          await loadLeaderboard();
          break;

      }

    } catch (error) {

      showToast(
        error.message ||
        "Unable to load data."
      );

    }

  }


  /* =====================================================
     DASHBOARD
  ====================================================== */

  async function loadDashboard() {

    const data =
      await api(
        "/api/admin/dashboard"
      );

    state.dashboard =
      data;

    const stats =
      data.stats || {};

    $("#statPlayers")
      .textContent =
      number(
        stats.total_players
      );

    $("#statActive")
      .textContent =
      number(
        stats.active_today
      );

    $("#statCheckins")
      .textContent =
      number(
        stats.checkins_today
      );

    $("#statPoints")
      .textContent =
      number(
        stats.points_issued
      );

    $("#statReferrals")
      .textContent =
      number(
        stats.referrals
      );

    $("#statClaims")
      .textContent =
      number(
        stats.rewards_claimed
      );

    renderActivityChart(
      data.activity_chart || []
    );

    renderRecentActivity(
      data.recent_activity || []
    );

    renderReferralSummary();

  }


  function renderActivityChart(
    rows
  ) {

    const container =
      $("#activityChart");

    const map = {};

    for (const row of rows) {

      map[row.day] =
        Number(
          row.total || 0
        );

    }

    const days = [];

    for (
      let i = 6;
      i >= 0;
      i--
    ) {

      const date =
        new Date();

      date.setDate(
        date.getDate() - i
      );

      const key =
        date
          .toISOString()
          .slice(0,10);

      days.push({
        key,
        label:
          date
            .toLocaleDateString(
              "en-US",
              {
                weekday:
                  "short"
              }
            ),

        value:
          map[key] || 0
      });

    }

    const max =
      Math.max(
        1,
        ...days.map(
          item =>
            item.value
        )
      );

    container.innerHTML =
      days
        .map(
          item => {

            const height =
              Math.max(
                3,
                (
                  item.value /
                  max
                ) * 100
              );

            return `
              <div class="chart-day">

                <strong>
                  ${number(
                    item.value
                  )}
                </strong>

                <div class="chart-bar-wrap">

                  <div
                    class="chart-bar"
                    style="
                      height:
                      ${height}%
                    "
                  ></div>

                </div>

                <span>
                  ${escapeHtml(
                    item.label
                  )}
                </span>

              </div>
            `;

          }
        )
        .join("");

  }


  function renderRecentActivity(
    activity
  ) {

    const container =
      $("#recentActivity");

    if (!activity.length) {

      container.innerHTML = `
        <div class="empty-state">

          <div class="empty-symbol">
            ◷
          </div>

          <strong>
            No activity yet
          </strong>

          <p>
            Player activity will appear here automatically after Telegram users begin interacting with Rico Club.
          </p>

        </div>
      `;

      return;

    }

    container.innerHTML =
      activity
        .map(
          item => {

            const player =
              item.telegram_username
                ? `@${item.telegram_username}`
                : (
                    item.first_name ||
                    "Rico Member"
                  );

            return `
              <div class="activity-item">

                <div class="activity-badge">
                  ${activityIcon(
                    item.event_type
                  )}
                </div>

                <div>

                  <strong>
                    ${escapeHtml(
                      item.title
                    )}
                  </strong>

                  <p>
                    ${escapeHtml(
                      player
                    )}
                    ${
                      item.description
                        ? ` · ${escapeHtml(
                            item.description
                          )}`
                        : ""
                    }
                  </p>

                </div>

                <span class="activity-time">
                  ${formatDateTime(
                    item.created_at
                  )}
                </span>

              </div>
            `;

          }
        )
        .join("");

  }


  /* =====================================================
     PLAYERS
  ====================================================== */

  async function loadPlayers(
    search = ""
  ) {

    const query =
      search
        ? `?search=${
            encodeURIComponent(
              search
            )
          }`
        : "";

    const data =
      await api(
        `/api/admin/players${query}`
      );

    state.players =
      data.players || [];

    renderPlayers();

  }


  function renderPlayers() {

    const tbody =
      $("#playersTable");

    const empty =
      $("#playersEmpty");

    if (!state.players.length) {

      tbody.innerHTML = "";

      empty
        .classList
        .remove("hidden");

      return;

    }

    empty
      .classList
      .add("hidden");

    tbody.innerHTML =
      state.players
        .map(
          player => {

            const name =
              displayName(
                player
              );

            return `
              <tr
                data-player-id="${
                  player.id
                }"
              >

                <td>

                  <div class="table-player">

                    <div class="table-avatar">
                      ${initial(
                        player
                      )}
                    </div>

                    <div>

                      <strong>
                        ${escapeHtml(
                          name
                        )}
                      </strong>

                      <span>
                        ${
                          player
                            .telegram_username
                            ? `@${
                                escapeHtml(
                                  player
                                    .telegram_username
                                )
                              }`
                            : "No username"
                        }
                      </span>

                    </div>

                  </div>

                </td>

                <td>
                  ${escapeHtml(
                    player.telegram_id
                  )}
                </td>

                <td>
                  ${number(
                    player
                      .current_points
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    player.tier ||
                    "Rookie"
                  )}
                </td>

                <td>
                  ${
                    player
                      .current_streak ||
                    0
                  } days
                </td>

                <td>
                  ${number(
                    player.referrals
                  )}
                </td>

                <td>
                  ${formatDateTime(
                    player
                      .last_active_at
                  )}
                </td>

                <td>
                  <span
                    class="status-badge ${
                      escapeAttribute(
                        player.status ||
                        "active"
                      )
                    }"
                  >
                    ${escapeHtml(
                      player.status ||
                      "active"
                    )}
                  </span>
                </td>

              </tr>
            `;

          }
        )
        .join("");

    $$("#playersTable tr")
      .forEach(
        row => {

          row.addEventListener(
            "click",
            () =>
              openPlayer(
                row.dataset
                  .playerId
              )
          );

        }
      );

  }


  async function openPlayer(
    id
  ) {

    const data =
      await api(
        `/api/admin/player/${id}`
      );

    state.selectedPlayer =
      data;

    renderPlayerDrawer(
      data
    );

    $("#drawerOverlay")
      .classList.remove(
        "hidden"
      );

    $("#playerDrawer")
      .classList.add(
        "open"
      );

  }


  function closePlayerDrawer() {

    $("#drawerOverlay")
      .classList.add(
        "hidden"
      );

    $("#playerDrawer")
      .classList.remove(
        "open"
      );

  }


  function renderPlayerDrawer(
    data
  ) {

    const player =
      data.player;

    const transactions =
      data.transactions || [];

    const activity =
      data.activity || [];

    const referrals =
      data.referrals || [];

    const rewards =
      data.rewards || [];

    const messages =
      data.messages || [];

    $("#playerDrawerContent")
      .innerHTML = `
        <div class="player-detail">

          <div class="player-profile-head">

            <div class="player-profile-avatar">
              ${initial(player)}
            </div>

            <div>

              <h2>
                ${escapeHtml(
                  displayName(player)
                )}
              </h2>

              <p>
                ${
                  player.telegram_username
                    ? `@${
                        escapeHtml(
                          player
                            .telegram_username
                        )
                      }`
                    : "Telegram Member"
                }
              </p>

              <span
                class="status-badge ${
                  escapeAttribute(
                    player.status
                  )
                }"
              >
                ${escapeHtml(
                  player.status
                )}
              </span>

            </div>

          </div>


          <div class="player-detail-stats">

            <div class="player-detail-stat">

              <span>
                POINTS
              </span>

              <strong>
                ${number(
                  player
                    .current_points
                )}
              </strong>

            </div>

            <div class="player-detail-stat">

              <span>
                TIER
              </span>

              <strong>
                ${escapeHtml(
                  player.tier
                )}
              </strong>

            </div>

            <div class="player-detail-stat">

              <span>
                STREAK
              </span>

              <strong>
                ${
                  player
                    .current_streak
                }
              </strong>

            </div>

            <div class="player-detail-stat">

              <span>
                RANK
              </span>

              <strong>
                #${data.rank || "—"}
              </strong>

            </div>

          </div>


          <div class="player-actions">

            <button
              type="button"
              data-player-action="message"
            >
              Send Message
            </button>

            <button
              type="button"
              data-player-action="add"
            >
              + Points
            </button>

            <button
              type="button"
              data-player-action="deduct"
            >
              − Points
            </button>

          </div>


          <div class="player-tabs">

            <button
              class="player-tab active"
              data-player-tab="activity"
              type="button"
            >
              Activity
            </button>

            <button
              class="player-tab"
              data-player-tab="points"
              type="button"
            >
              Points
            </button>

            <button
              class="player-tab"
              data-player-tab="rewards"
              type="button"
            >
              Rewards
            </button>

            <button
              class="player-tab"
              data-player-tab="referrals"
              type="button"
            >
              Referrals
            </button>

            <button
              class="player-tab"
              data-player-tab="messages"
              type="button"
            >
              Messages
            </button>

          </div>


          <div
            id="playerTabContent"
            class="player-tab-content"
          >
            ${renderPlayerActivity(
              activity
            )}
          </div>

        </div>
      `;


    $$("[data-player-action]")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const action =
                button.dataset
                  .playerAction;

              if (
                action ===
                "message"
              ) {

                openMessageModal(
                  player
                );

              }

              if (
                action ===
                "add"
              ) {

                openPointsModal(
                  player,
                  "add"
                );

              }

              if (
                action ===
                "deduct"
              ) {

                openPointsModal(
                  player,
                  "deduct"
                );

              }

            }
          );

        }
      );


    $$(".player-tab")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              $$(".player-tab")
                .forEach(
                  tab =>
                    tab
                      .classList
                      .remove(
                        "active"
                      )
                );

              button
                .classList
                .add("active");

              const tab =
                button.dataset
                  .playerTab;

              const target =
                $(
                  "#playerTabContent"
                );

              if (
                tab ===
                "activity"
              ) {

                target.innerHTML =
                  renderPlayerActivity(
                    activity
                  );

              }

              if (
                tab ===
                "points"
              ) {

                target.innerHTML =
                  renderTransactions(
                    transactions
                  );

              }

              if (
                tab ===
                "rewards"
              ) {

                target.innerHTML =
                  renderSimpleRows(
                    rewards,
                    item =>
                      item.title,
                    item =>
                      `${number(
                        item.points_spent
                      )} points`,
                    item =>
                      item.created_at
                  );

              }

              if (
                tab ===
                "referrals"
              ) {

                target.innerHTML =
                  renderSimpleRows(
                    referrals,
                    item =>
                      item
                        .telegram_username
                        ? `@${
                            item
                              .telegram_username
                          }`
                        : (
                            item
                              .first_name ||
                            "Rico Member"
                          ),
                    item =>
                      item.status,
                    item =>
                      item.created_at
                  );

              }

              if (
                tab ===
                "messages"
              ) {

                target.innerHTML =
                  renderSimpleRows(
                    messages,
                    item =>
                      item
                        .message_text,
                    item =>
                      item.status,
                    item =>
                      item.created_at
                  );

              }

            }
          );

        }
      );

  }


  function renderPlayerActivity(
    rows
  ) {

    if (!rows.length) {
      return playerEmpty(
        "No activity recorded"
      );
    }

    return rows
      .map(
        item => `
          <div class="timeline-item">

            <div class="timeline-dot">
            </div>

            <div>

              <strong>
                ${escapeHtml(
                  item.title
                )}
              </strong>

              ${
                item.description
                  ? `
                    <p>
                      ${escapeHtml(
                        item.description
                      )}
                    </p>
                  `
                  : ""
              }

              <time>
                ${formatDateTime(
                  item.created_at
                )}
              </time>

            </div>

          </div>
        `
      )
      .join("");

  }


  function renderTransactions(
    rows
  ) {

    if (!rows.length) {
      return playerEmpty(
        "No point transactions"
      );
    }

    return rows
      .map(
        item => `
          <div class="timeline-item">

            <div class="timeline-dot">
            </div>

            <div>

              <strong>
                ${
                  Number(
                    item.amount
                  ) >= 0
                    ? "+"
                    : ""
                }${number(
                  item.amount
                )} Rico Points
              </strong>

              <p>
                ${escapeHtml(
                  item.description ||
                  item.transaction_type
                )}
              </p>

              <time>
                ${formatDateTime(
                  item.created_at
                )}
              </time>

            </div>

          </div>
        `
      )
      .join("");

  }


  function renderSimpleRows(
    rows,
    title,
    subtitle,
    date
  ) {

    if (!rows.length) {
      return playerEmpty(
        "No records"
      );
    }

    return rows
      .map(
        item => `
          <div class="timeline-item">

            <div class="timeline-dot">
            </div>

            <div>

              <strong>
                ${escapeHtml(
                  title(item)
                )}
              </strong>

              <p>
                ${escapeHtml(
                  subtitle(item)
                )}
              </p>

              <time>
                ${formatDateTime(
                  date(item)
                )}
              </time>

            </div>

          </div>
        `
      )
      .join("");

  }


  function playerEmpty(
    message
  ) {

    return `
      <div class="empty-state">

        <strong>
          ${escapeHtml(
            message
          )}
        </strong>

      </div>
    `;

  }


  /* =====================================================
     MISSIONS
  ====================================================== */

  async function loadMissions() {

    const data =
      await api(
        "/api/admin/missions"
      );

    state.missions =
      data.missions || [];

    renderMissions();

  }


  function renderMissions() {

    const grid =
      $("#missionsGrid");

    const empty =
      $("#missionsEmpty");

    if (!state.missions.length) {

      grid.innerHTML = "";

      empty
        .classList
        .remove("hidden");

      return;

    }

    empty
      .classList
      .add("hidden");

    grid.innerHTML =
      state.missions
        .map(
          mission => `
            <article class="management-card">

              <div class="management-card-top">

                <div class="management-symbol">
                  ◇
                </div>

                <span
                  class="status-badge ${
                    escapeAttribute(
                      mission.status
                    )
                  }"
                >
                  ${escapeHtml(
                    mission.status
                  )}
                </span>

              </div>

              <h3>
                ${escapeHtml(
                  mission.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  mission.description ||
                  "Rico Club mission"
                )}
              </p>

              <div class="management-meta">

                <div>

                  <span>
                    TYPE
                  </span>

                  <strong>
                    ${escapeHtml(
                      mission
                        .mission_type
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    REWARD
                  </span>

                  <strong>
                    +${number(
                      mission
                        .reward_points
                    )}
                  </strong>

                </div>

              </div>

            </article>
          `
        )
        .join("");

  }


  function openMissionModal() {

    openModal(
      "MISSION",
      "Create Mission",
      `
        <form
          id="missionForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">

              <span>
                Mission Name
              </span>

              <input
                id="missionTitle"
                required
                type="text"
              >

            </label>


            <label class="field wide">

              <span>
                Description
              </span>

              <textarea
                id="missionDescription"
              ></textarea>

            </label>


            <label class="field">

              <span>
                Mission Type
              </span>

              <select
                id="missionType"
              >

                <option value="checkin">
                  Daily Check-in
                </option>

                <option value="referral">
                  Referral
                </option>

                <option value="channel">
                  Telegram Channel
                </option>

                <option value="promo">
                  Promo Code
                </option>

                <option value="custom">
                  Custom
                </option>

              </select>

            </label>


            <label class="field">

              <span>
                Target
              </span>

              <input
                id="missionTarget"
                type="number"
                min="1"
                value="1"
              >

            </label>


            <label class="field">

              <span>
                Reward Points
              </span>

              <input
                id="missionReward"
                type="number"
                min="0"
                value="0"
              >

            </label>


            <label class="field">

              <span>
                Status
              </span>

              <select
                id="missionStatus"
              >

                <option value="draft">
                  Draft
                </option>

                <option value="active">
                  Active
                </option>

              </select>

            </label>


            <label class="field">

              <span>
                Start Date
              </span>

              <input
                id="missionStart"
                type="datetime-local"
              >

            </label>


            <label class="field">

              <span>
                End Date
              </span>

              <input
                id="missionEnd"
                type="datetime-local"
              >

            </label>


            <label class="field">

              <span>
                Button Text
              </span>

              <input
                id="missionButton"
                type="text"
              >

            </label>


            <label class="field">

              <span>
                Button URL
              </span>

              <input
                id="missionUrl"
                type="url"
              >

            </label>

          </div>


          <div class="modal-actions">

            <button
              class="ghost-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Create Mission
            </button>

          </div>

        </form>
      `
    );


    $("#missionForm")
      .addEventListener(
        "submit",
        createMission
      );

    bindModalCloseButtons();

  }


  async function createMission(
    event
  ) {

    event.preventDefault();

    const payload = {

      title:
        $("#missionTitle")
          .value
          .trim(),

      description:
        $("#missionDescription")
          .value
          .trim(),

      mission_type:
        $("#missionType")
          .value,

      target_value:
        Number(
          $("#missionTarget")
            .value
        ),

      reward_points:
        Number(
          $("#missionReward")
            .value
        ),

      status:
        $("#missionStatus")
          .value,

      start_at:
        toDatabaseDate(
          $("#missionStart")
            .value
        ),

      end_at:
        toDatabaseDate(
          $("#missionEnd")
            .value
        ),

      button_text:
        $("#missionButton")
          .value
          .trim(),

      button_url:
        $("#missionUrl")
          .value
          .trim()

    };


    await api(
      "/api/admin/missions",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          )
      }
    );


    closeModal();

    showToast(
      "Mission created."
    );

    await loadMissions();

  }


  /* =====================================================
     REWARDS
  ====================================================== */

  async function loadRewards() {

    const data =
      await api(
        "/api/admin/rewards"
      );

    state.rewards =
      data.rewards || [];

    renderRewards();

  }


  function renderRewards() {

    const grid =
      $("#rewardsGrid");

    const empty =
      $("#rewardsEmpty");

    if (!state.rewards.length) {

      grid.innerHTML = "";

      empty
        .classList
        .remove("hidden");

      return;

    }

    empty
      .classList
      .add("hidden");

    grid.innerHTML =
      state.rewards
        .map(
          reward => `
            <article class="management-card">

              <div class="management-card-top">

                <div class="management-symbol">
                  ◆
                </div>

                <span
                  class="status-badge ${
                    escapeAttribute(
                      reward.status
                    )
                  }"
                >
                  ${escapeHtml(
                    reward.status
                  )}
                </span>

              </div>

              <h3>
                ${escapeHtml(
                  reward.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  reward.description ||
                  "Rico Club reward"
                )}
              </p>

              <div class="management-meta">

                <div>

                  <span>
                    COST
                  </span>

                  <strong>
                    ${number(
                      reward
                        .points_cost
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    STOCK
                  </span>

                  <strong>
                    ${
                      reward.stock ===
                      null
                        ? "Unlimited"
                        : number(
                            reward.stock
                          )
                    }
                  </strong>

                </div>

              </div>

            </article>
          `
        )
        .join("");

  }


  function openRewardModal() {

    openModal(
      "REWARD",
      "Create Reward",
      `
        <form
          id="rewardForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">

              <span>
                Reward Name
              </span>

              <input
                id="rewardTitle"
                required
                type="text"
              >

            </label>


            <label class="field wide">

              <span>
                Description
              </span>

              <textarea
                id="rewardDescription"
              ></textarea>

            </label>


            <label class="field">

              <span>
                Reward Type
              </span>

              <select
                id="rewardType"
              >

                <option value="manual">
                  Manual Reward
                </option>

                <option value="voucher">
                  Voucher
                </option>

                <option value="promo">
                  Promo Code
                </option>

                <option value="mystery">
                  Mystery Reward
                </option>

              </select>

            </label>


            <label class="field">

              <span>
                Points Cost
              </span>

              <input
                id="rewardCost"
                type="number"
                min="0"
                value="0"
              >

            </label>


            <label class="field">

              <span>
                Stock
              </span>

              <input
                id="rewardStock"
                type="number"
                min="0"
                placeholder="Leave empty for unlimited"
              >

            </label>


            <label class="field">

              <span>
                Required Tier
              </span>

              <select
                id="rewardTier"
              >

                <option value="">
                  Everyone
                </option>

                <option value="Rookie">
                  Rookie
                </option>

                <option value="Bronze">
                  Bronze
                </option>

                <option value="Silver">
                  Silver
                </option>

                <option value="Gold">
                  Gold
                </option>

                <option value="Diamond">
                  Diamond
                </option>

              </select>

            </label>


            <label class="field">

              <span>
                Start Date
              </span>

              <input
                id="rewardStart"
                type="datetime-local"
              >

            </label>


            <label class="field">

              <span>
                End Date
              </span>

              <input
                id="rewardEnd"
                type="datetime-local"
              >

            </label>


            <label class="field">

              <span>
                Status
              </span>

              <select
                id="rewardStatus"
              >

                <option value="draft">
                  Draft
                </option>

                <option value="active">
                  Active
                </option>

              </select>

            </label>

          </div>


          <div class="modal-actions">

            <button
              class="ghost-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Create Reward
            </button>

          </div>

        </form>
      `
    );


    $("#rewardForm")
      .addEventListener(
        "submit",
        createReward
      );

    bindModalCloseButtons();

  }


  async function createReward(
    event
  ) {

    event.preventDefault();

    const stock =
      $("#rewardStock")
        .value;

    const payload = {

      title:
        $("#rewardTitle")
          .value
          .trim(),

      description:
        $("#rewardDescription")
          .value
          .trim(),

      reward_type:
        $("#rewardType")
          .value,

      points_cost:
        Number(
          $("#rewardCost")
            .value
        ),

      stock:
        stock === ""
          ? null
          : Number(stock),

      required_tier:
        $("#rewardTier")
          .value ||
        null,

      start_at:
        toDatabaseDate(
          $("#rewardStart")
            .value
        ),

      end_at:
        toDatabaseDate(
          $("#rewardEnd")
            .value
        ),

      status:
        $("#rewardStatus")
          .value

    };


    await api(
      "/api/admin/rewards",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          )
      }
    );


    closeModal();

    showToast(
      "Reward created."
    );

    await loadRewards();

  }


  /* =====================================================
     DROPS
  ====================================================== */

  async function loadDrops() {

    const data =
      await api(
        "/api/admin/drops"
      );

    state.drops =
      data.drops || [];

    renderDrops();

  }


  function renderDrops() {

    const grid =
      $("#dropsGrid");

    const empty =
      $("#dropsEmpty");

    if (!state.drops.length) {

      grid.innerHTML = "";

      empty
        .classList
        .remove("hidden");

      return;

    }

    empty
      .classList
      .add("hidden");

    grid.innerHTML =
      state.drops
        .map(
          drop => `
            <article class="management-card">

              <div class="management-card-top">

                <div class="management-symbol">
                  ✦
                </div>

                <span
                  class="status-badge ${
                    escapeAttribute(
                      drop.status
                    )
                  }"
                >
                  ${escapeHtml(
                    drop.status
                  )}
                </span>

              </div>

              <h3>
                ${escapeHtml(
                  drop.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  drop.description ||
                  "Rico Club reward drop"
                )}
              </p>

              <div class="management-meta">

                <div>

                  <span>
                    QUANTITY
                  </span>

                  <strong>
                    ${number(
                      drop
                        .total_quantity
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    CLAIMED
                  </span>

                  <strong>
                    ${number(
                      drop
                        .claimed_quantity
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    START
                  </span>

                  <strong>
                    ${formatDateTime(
                      drop.start_at
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    END
                  </span>

                  <strong>
                    ${formatDateTime(
                      drop.end_at
                    )}
                  </strong>

                </div>

              </div>

            </article>
          `
        )
        .join("");

  }


  function openDropModal() {

    openModal(
      "REWARD DROP",
      "Create Drop",
      `
        <form
          id="dropForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">

              <span>
                Drop Name
              </span>

              <input
                id="dropTitle"
                required
                type="text"
              >

            </label>


            <label class="field wide">

              <span>
                Description
              </span>

              <textarea
                id="dropDescription"
              ></textarea>

            </label>


            <label class="field">

              <span>
                Reward Type
              </span>

              <select
                id="dropRewardType"
              >

                <option value="points">
                  Rico Points
                </option>

                <option value="voucher">
                  Voucher
                </option>

                <option value="mystery">
                  Mystery Reward
                </option>

              </select>

            </label>


            <label class="field">

              <span>
                Reward Value
              </span>

              <input
                id="dropReward"
                type="number"
                min="0"
                value="0"
              >

            </label>


            <label class="field">

              <span>
                Quantity
              </span>

              <input
                id="dropQuantity"
                required
                type="number"
                min="1"
              >

            </label>


            <label class="field">

              <span>
                Claim Limit Per Player
              </span>

              <input
                id="dropLimit"
                type="number"
                min="1"
                value="1"
              >

            </label>


            <label class="field">

              <span>
                Start Date
              </span>

              <input
                id="dropStart"
                required
                type="datetime-local"
              >

            </label>


            <label class="field">

              <span>
                End Date
              </span>

              <input
                id="dropEnd"
                required
                type="datetime-local"
              >

            </label>


            <label class="field">

              <span>
                Required Tier
              </span>

              <select
                id="dropTier"
              >

                <option value="">
                  Everyone
                </option>

                <option value="Rookie">
                  Rookie
                </option>

                <option value="Bronze">
                  Bronze
                </option>

                <option value="Silver">
                  Silver
                </option>

                <option value="Gold">
                  Gold
                </option>

                <option value="Diamond">
                  Diamond
                </option>

              </select>

            </label>


            <label class="field">

              <span>
                Status
              </span>

              <select
                id="dropStatus"
              >

                <option value="draft">
                  Draft
                </option>

                <option value="scheduled">
                  Scheduled
                </option>

                <option value="active">
                  Active
                </option>

              </select>

            </label>

          </div>


          <div class="modal-actions">

            <button
              class="ghost-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Create Drop
            </button>

          </div>

        </form>
      `
    );


    $("#dropForm")
      .addEventListener(
        "submit",
        createDrop
      );

    bindModalCloseButtons();

  }


  async function createDrop(
    event
  ) {

    event.preventDefault();

    const payload = {

      title:
        $("#dropTitle")
          .value
          .trim(),

      description:
        $("#dropDescription")
          .value
          .trim(),

      reward_type:
        $("#dropRewardType")
          .value,

      reward_value:
        Number(
          $("#dropReward")
            .value
        ),

      total_quantity:
        Number(
          $("#dropQuantity")
            .value
        ),

      claim_limit_per_user:
        Number(
          $("#dropLimit")
            .value
        ),

      start_at:
        toDatabaseDate(
          $("#dropStart")
            .value
        ),

      end_at:
        toDatabaseDate(
          $("#dropEnd")
            .value
        ),

      required_tier:
        $("#dropTier")
          .value ||
        null,

      status:
        $("#dropStatus")
          .value

    };


    await api(
      "/api/admin/drops",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          )
      }
    );


    closeModal();

    showToast(
      "Reward drop created."
    );

    await loadDrops();

  }


  /* =====================================================
     LEADERBOARD
  ====================================================== */

  async function loadLeaderboard() {

    if (!state.players.length) {
      await loadPlayers();
    }

    const rows =
      [...state.players]
        .sort(
          (a,b) =>
            Number(
              b.current_points ||
              0
            ) -
            Number(
              a.current_points ||
              0
            )
        );

    const table =
      $("#leaderboardTable");

    const empty =
      $("#leaderboardEmpty");

    if (!rows.length) {

      table.innerHTML = "";

      empty
        .classList
        .remove("hidden");

      return;

    }

    empty
      .classList
      .add("hidden");

    table.innerHTML =
      rows
        .map(
          (player,index) => `
            <tr
              data-player-id="${
                player.id
              }"
            >

              <td>
                #${index + 1}
              </td>

              <td>

                <div class="table-player">

                  <div class="table-avatar">
                    ${initial(
                      player
                    )}
                  </div>

                  <div>

                    <strong>
                      ${escapeHtml(
                        displayName(
                          player
                        )
                      )}
                    </strong>

                    <span>
                      ${
                        player
                          .telegram_username
                          ? `@${
                              escapeHtml(
                                player
                                  .telegram_username
                              )
                            }`
                          : "Telegram Member"
                      }
                    </span>

                  </div>

                </div>

              </td>

              <td>
                ${escapeHtml(
                  player.tier
                )}
              </td>

              <td>
                ${number(
                  player
                    .current_points
                )}
              </td>

              <td>
                ${
                  player
                    .current_streak
                } days
              </td>

            </tr>
          `
        )
        .join("");

    $$("#leaderboardTable tr")
      .forEach(
        row =>
          row.addEventListener(
            "click",
            () =>
              openPlayer(
                row.dataset
                  .playerId
              )
          )
      );

  }


  function renderReferralSummary() {

    const total =
      state.dashboard
        ?.stats
        ?.referrals || 0;

    $("#refTotal")
      .textContent =
      number(total);

    $("#refQualified")
      .textContent =
      "0";

    $("#refPending")
      .textContent =
      number(total);

  }


  /* =====================================================
     PLAYER ACTION MODALS
  ====================================================== */

  function openPointsModal(
    player,
    type
  ) {

    const adding =
      type === "add";

    openModal(
      "PLAYER POINTS",

      adding
        ? "Add Rico Points"
        : "Deduct Rico Points",

      `
        <form
          id="pointsForm"
          class="modal-form"
        >

          <p class="panel-description">
            ${
              adding
                ? "Add"
                : "Deduct"
            }
            points for
            <strong>
              ${escapeHtml(
                displayName(
                  player
                )
              )}
            </strong>.
            Every adjustment is recorded in the player's point history.
          </p>

          <label class="field">

            <span>
              Amount
            </span>

            <input
              id="pointsAmount"
              required
              min="1"
              type="number"
            >

          </label>


          <label class="field">

            <span>
              Reason
            </span>

            <textarea
              id="pointsReason"
              required
            ></textarea>

          </label>


          <div class="modal-actions">

            <button
              class="ghost-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Confirm
            </button>

          </div>

        </form>
      `
    );


    $("#pointsForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          let amount =
            Math.abs(
              Number(
                $("#pointsAmount")
                  .value
              )
            );

          if (!adding) {
            amount =
              -amount;
          }

          await api(
            `/api/admin/player/${player.id}/points`,
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  amount,

                  reason:
                    $("#pointsReason")
                      .value
                      .trim()
                })
            }
          );

          closeModal();

          showToast(
            "Player points updated."
          );

          await openPlayer(
            player.id
          );

          await loadDashboard();

        }
      );

    bindModalCloseButtons();

  }


  function openMessageModal(
    player
  ) {

    openModal(
      "TELEGRAM",

      "Send Message",

      `
        <form
          id="messageForm"
          class="modal-form"
        >

          <p class="panel-description">
            Message
            <strong>
              ${escapeHtml(
                displayName(
                  player
                )
              )}
            </strong>
            directly through the Rico Club Telegram bot.
          </p>


          <label class="field">

            <span>
              Message
            </span>

            <textarea
              id="messageText"
              required
            ></textarea>

          </label>


          <div class="form-grid">

            <label class="field">

              <span>
                Button Text
              </span>

              <input
                id="messageButton"
                type="text"
              >

            </label>


            <label class="field">

              <span>
                Button URL
              </span>

              <input
                id="messageUrl"
                type="url"
              >

            </label>

          </div>


          <div class="modal-actions">

            <button
              class="ghost-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Send Message
            </button>

          </div>

        </form>
      `
    );


    $("#messageForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          await api(
            `/api/admin/player/${player.id}/message`,
            {
              method:
                "POST",

              body:
                JSON.stringify({

                  message:
                    $("#messageText")
                      .value
                      .trim(),

                  button_text:
                    $("#messageButton")
                      .value
                      .trim(),

                  button_url:
                    $("#messageUrl")
                      .value
                      .trim()

                })
            }
          );

          closeModal();

          showToast(
            "Telegram message sent."
          );

          await openPlayer(
            player.id
          );

        }
      );

    bindModalCloseButtons();

  }


  /* =====================================================
     MODAL
  ====================================================== */

  function openModal(
    eyebrow,
    title,
    body
  ) {

    $("#modalEyebrow")
      .textContent =
      eyebrow;

    $("#modalTitle")
      .textContent =
      title;

    $("#modalBody")
      .innerHTML =
      body;

    $("#modalOverlay")
      .classList.remove(
        "hidden"
      );

  }


  function closeModal() {

    $("#modalOverlay")
      .classList.add(
        "hidden"
      );

    $("#modalBody")
      .innerHTML = "";

  }


  function bindModalCloseButtons() {

    $$("[data-close-modal]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            closeModal
          )
      );

  }


  /* =====================================================
     EVENTS
  ====================================================== */

  function bindGlobalEvents() {

    $("#loginForm")
      .addEventListener(
        "submit",
        login
      );


    $("#togglePassword")
      .addEventListener(
        "click",
        () => {

          const input =
            $("#loginPassword");

          const show =
            input.type ===
            "password";

          input.type =
            show
              ? "text"
              : "password";

          $("#togglePassword")
            .textContent =
            show
              ? "Hide"
              : "Show";

        }
      );


    $("#logoutButton")
      .addEventListener(
        "click",
        logout
      );


    $$(".nav-link")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              openSection(
                button.dataset
                  .section
              )
          );

        }
      );


    $("#refreshCurrent")
      .addEventListener(
        "click",
        () =>
          loadSection(
            state
              .currentSection
          )
      );


    $("#sidebarToggle")
      .addEventListener(
        "click",
        () =>
          $("#sidebar")
            .classList
            .add(
              "mobile-open"
            )
      );


    $("#sidebarClose")
      .addEventListener(
        "click",
        () =>
          $("#sidebar")
            .classList
            .remove(
              "mobile-open"
            )
      );


    $("#playerSearchButton")
      .addEventListener(
        "click",
        () =>
          loadPlayers(
            $("#playerSearch")
              .value
              .trim()
          )
      );


    $("#playerSearch")
      .addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Enter"
          ) {

            loadPlayers(
              event
                .currentTarget
                .value
                .trim()
            );

          }

        }
      );


    $("#createMissionButton")
      .addEventListener(
        "click",
        openMissionModal
      );


    $("#createRewardButton")
      .addEventListener(
        "click",
        openRewardModal
      );


    $("#createDropButton")
      .addEventListener(
        "click",
        openDropModal
      );


    $("#openPlayersFromMessages")
      .addEventListener(
        "click",
        () =>
          openSection(
            "players"
          )
      );


    $("#closePlayerDrawer")
      .addEventListener(
        "click",
        closePlayerDrawer
      );


    $("#drawerOverlay")
      .addEventListener(
        "click",
        closePlayerDrawer
      );


    $("#closeModal")
      .addEventListener(
        "click",
        closeModal
      );


    $("#modalOverlay")
      .addEventListener(
        "click",
        event => {

          if (
            event.target ===
            $("#modalOverlay")
          ) {
            closeModal();
          }

        }
      );

  }


  /* =====================================================
     API
  ====================================================== */

  async function api(
    path,
    options = {}
  ) {

    const response =
      await fetch(
        path,
        {
          credentials:
            "same-origin",

          ...options,

          headers: {
            "content-type":
              "application/json",

            ...(options.headers || {})
          }
        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch {
      data = {};
    }


    if (
      response.status ===
      401
    ) {

      state.admin = null;

      showLogin();

      throw new Error(
        "Your admin session has expired."
      );

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Request failed"
      );

    }


    return data;

  }


  /* =====================================================
     HELPERS
  ====================================================== */

  function displayName(
    player
  ) {

    return [
      player.first_name,
      player.last_name
    ]
      .filter(Boolean)
      .join(" ")
      ||
      player.telegram_username
      ||
      "Rico Member";

  }


  function initial(
    player
  ) {

    return String(
      player.first_name ||
      player.telegram_username ||
      "R"
    )
      .charAt(0)
      .toUpperCase();

  }


  function number(
    value
  ) {

    return new Intl
      .NumberFormat(
        "en-US"
      )
      .format(
        Number(
          value || 0
        )
      );

  }


  function formatDateTime(
    value
  ) {

    if (!value) {
      return "—";
    }

    const normalized =
      String(value)
        .includes("T")
        ? value
        : String(value)
            .replace(
              " ",
              "T"
            ) + "Z";

    const date =
      new Date(
        normalized
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date
      .toLocaleString(
        "en-GB",
        {
          day:
            "2-digit",

          month:
            "short",

          hour:
            "2-digit",

          minute:
            "2-digit"
        }
      );

  }


  function toDatabaseDate(
    value
  ) {

    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date
      .toISOString()
      .replace(
        "T",
        " "
      )
      .replace(
        "Z",
        ""
      );

  }


  function activityIcon(
    type
  ) {

    const map = {

      checkin:
        "✓",

      account_created:
        "◎",

      admin_adjustment:
        "◆",

      referral:
        "↗",

      reward:
        "✦"

    };

    return map[type] ||
      "•";

  }


  function escapeHtml(
    value
  ) {

    const element =
      document
        .createElement(
          "div"
        );

    element.textContent =
      String(
        value ?? ""
      );

    return element.innerHTML;

  }


  function escapeAttribute(
    value
  ) {

    return escapeHtml(
      value
    )
      .replace(
        /"/g,
        "&quot;"
      );

  }


  function showToast(
    message
  ) {

    const toast =
      $("#adminToast");

    toast.textContent =
      message;

    toast
      .classList
      .add(
        "visible"
      );

    clearTimeout(
      showToast.timer
    );

    showToast.timer =
      setTimeout(
        () =>
          toast
            .classList
            .remove(
              "visible"
            ),
        2600
      );

  }

})();
