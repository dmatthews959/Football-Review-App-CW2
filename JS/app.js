console.log("app.js loaded");

// ---------------------------
// LOGIC APP URLS
// ---------------------------
const IUPS =
  "https://prod-14.switzerlandnorth.logic.azure.com:443/workflows/c5dba29764294b10b7ffc4b8c032ef57/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=hoUSk9owHhYxELsXfb0hKq-HeW0GjZnVi0Q7gdMuv2c";

const RAI =
  "https://prod-22.switzerlandnorth.logic.azure.com:443/workflows/d1f76795e9f0453c8bf94c202c4f95c7/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=5vLDRadGoP8Hu5jK02ryr4KhfC9Ar5Rjs-G0Gn6bp8E";

const DELETE_REVIEW =
  "https://prod-11.switzerlandnorth.logic.azure.com:443/workflows/4a7817a9da964699bfa7fce9317aaec3/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=rTC7GQ-Bi3UHprKPHFMBKcPgLmu9dpJm9zgNJVMvvE8";

const UPDATE_REVIEW =
  "https://prod-06.switzerlandnorth.logic.azure.com:443/workflows/b04dbcc6b75340ad97c55e229da5f1e7/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=iq9F1FvFWRFCVGS_ehhQYO8LRy3ci_8N56ZqSamKOwI";

const CUSTOM_VISION_LOGICAPP_URL =
  "https://prod-07.switzerlandnorth.logic.azure.com:443/workflows/10f9afaa16d442eb93afd6e2af74054a/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=eOLEheMgdQfgridCbwTIOjXjqQKC-KtdMTJRB3_GFeo";

const SINGLE_REVIEW_URL =
  "https://prod-08.switzerlandnorth.logic.azure.com:443/workflows/7bc6d58f6ca24324b0b9874a806b1ff4/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=eyHYNd5qus4nYXpOCnk2KGEUyuV5W2YI_TtVfmUnLvQ";

const AI_SEARCH_LOGICAPP_URL =
  "https://prod-15.switzerlandnorth.logic.azure.com:443/workflows/4cad9f0d8d744d13b7026670b1643b31/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=ylhAWLje7MRB3iL3_xZ1wbs5ZbUGsM0-WzlcZb5Z91g";

// Blob Storage base URL
const BLOB_ACCOUNT = "https://cw2blobstoragedec.blob.core.windows.net/";

// Global cache of reviews
window._allReviews = [];

// ---------------------------
// PAGE INITIALISATION
// ---------------------------
$(document).ready(function () {
  $("#retImages").click(getReviews);
  $("#subNewForm").click(submitNewReview);
});

// ---------------------------
// SUBMIT NEW REVIEW (MEDIA-AWARE)
// ---------------------------
function submitNewReview() {
  const submitData = new FormData();

  submitData.append("FileName", $("#FileName").val());
  submitData.append("userID", $("#userID").val());
  submitData.append("userName", $("#userName").val());
  submitData.append("homeTeam", $("#homeTeam").val());
  submitData.append("awayTeam", $("#awayTeam").val());
  submitData.append("comment", $("#comment").val());
  submitData.append("stars", $("#stars").val());

  const file = $("#UpFile")[0].files[0];

  if (file) {
    submitData.append("File", file);
    submitData.append("contentType", file.type);         // image/*, video/*, audio/*
    submitData.append("originalFileName", file.name);    // original file name
  }

  $.ajax({
    url: IUPS,
    data: submitData,
    cache: false,
    enctype: "multipart/form-data",
    contentType: false,
    processData: false,
    type: "POST",
    success: (data) => {
      console.log("Upload response:", data);
      alert("Review submitted successfully.");
      $("#newAssetForm")[0].reset();
    },
    error: (xhr, status, err) => {
      console.error("Upload failed:", status, err, xhr?.responseText);
      alert("Upload failed — see console for details.");
    },
  });
}

// ---------------------------
// GET REVIEWS (LIST VIEW)
// ---------------------------
function getReviews() {
  const $list = $("#ReviewList");
  $list
    .addClass("media-grid")
    .html(
      '<div class="spinner-border" role="status"><span>Loading...</span></div>'
    );

  $.ajax({
    url: RAI,
    type: "GET",
    dataType: "json",
    success: function (data) {
      console.log("Raw data received:", data);

      if (!Array.isArray(data)) {
        $list.html("<p>No reviews found or invalid data format.</p>");
        return;
      }

      window._allReviews = normaliseReviews(data);

      const cards = [];

      window._allReviews.forEach((review) => {
        try {
          const mediaHtml = renderMedia(review.contentType, review.filePath);

          cards.push(`
            <div class="media-card" onclick="goToSingleReview('${review.id}')" style="cursor:pointer;">
              <div class="media-thumb">
                ${mediaHtml}
              </div>
              <div class="media-body">
                <span class="media-title">${escapeHtml(review.fileName || "Football Match Review")}</span>
                <div><strong>Home Team:</strong> ${escapeHtml(review.homeTeam || "(unknown)")}</div>
                <div><strong>Away Team:</strong> ${escapeHtml(review.awayTeam || "(unknown)")}</div>
                <div><strong>Comment:</strong> ${escapeHtml(review.comment || "")}</div>
                <div><strong>Stars:</strong> ${escapeHtml(review.stars || "0")}/5</div>
                <div>Uploaded by: ${escapeHtml(review.userName || "(unknown)")} (id: ${escapeHtml(review.userID || "(unknown)")})</div>

                <div class="review-actions">
                  <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); openEditReview('${review.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteReview('${review.id}')">Delete</button>
                  <button class="btn btn-sm btn-info" onclick="event.stopPropagation(); analyseReviewImage('${review.id}')">Analyse Image</button>
                </div>

                <div class="cv-result" data-review-id="${review.id}" style="margin-top:6px;font-size:12px;color:#4b5563;"></div>
              </div>
            </div>
          `);
        } catch (err) {
          console.error("Error building card:", err, review);
          cards.push(`
            <div class="media-card">
              <div class="media-body">
                <span class="media-title" style="color:#b91c1c;">Error displaying this review</span>
              </div>
            </div>
          `);
        }
      });

      $list.html(cards.join(""));
    },
    error: (xhr, status, error) => {
      console.error("Error fetching reviews:", status, error, xhr?.responseText);
      $list.html(
        "<p style='color:red;'>Error loading reviews. Check console.</p>"
      );
    },
  });
}

// ---------------------------
// AI SEARCH
// ---------------------------
async function searchReviews(searchText) {
  const response = await fetch(AI_SEARCH_LOGICAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ searchText }),
  });

  const data = await response.json();
  return data.value; // Logic App returns Azure Search results in "value"
}

async function runSearch() {
  const text = document.getElementById("searchBox").value;
  const results = await searchReviews(text);

  const container = document.getElementById("results");
  container.innerHTML = "";

  results.forEach((r) => {
    const mediaHtml = renderMedia(r.contentType, r.filePath);

    container.innerHTML += `
  <div class="result">
    <h3>${r.homeTeam} vs ${r.awayTeam} (${r.stars}★)</h3>
    <p>${r.comment}</p>
    <div class="search-media-wrapper">
      ${mediaHtml}
    </div>
  </div>`;
  });
}

// ---------------------------
// NAVIGATION
// ---------------------------
function goToSingleReview(id) {
  if (!id) return;
  window.location.href = `reviews.html?id=${encodeURIComponent(id)}`;
}

// ---------------------------
// NORMALISE REVIEW DATA (LIST + SEARCH)
// ---------------------------
function normaliseReviews(data) {
  return data.map((val) => {
    const fileName = unwrapMaybeBase64(val.fileName ?? val.FileName ?? "");
    const filePath = unwrapMaybeBase64(val.filePath ?? val.FilePath ?? "");
    const userName = unwrapMaybeBase64(val.userName ?? val.UserName ?? "");
    const userID = unwrapMaybeBase64(val.userID ?? val.UserID ?? "");
    const homeTeam = unwrapMaybeBase64(val.homeTeam ?? val.HomeTeam ?? "");
    const awayTeam = unwrapMaybeBase64(val.awayTeam ?? val.AwayTeam ?? "");
    const comment = unwrapMaybeBase64(val.comment ?? val.Comment ?? "");
    const stars = unwrapMaybeBase64(val.stars ?? val.Stars ?? "0");
    const id = unwrapMaybeBase64(val.id ?? val.Id ?? val.ID ?? val._id ?? "");

    const contentType = val.contentType || val.ContentType || "";
    const url = buildBlobUrl(filePath);

    return {
      id,
      fileName,
      filePath,
      userName,
      userID,
      homeTeam,
      awayTeam,
      comment,
      stars,
      contentType,
      url,
    };
  });
}

// ---------------------------
// SINGLE REVIEW PAGE (RESTORED STYLE)
// ---------------------------
async function fetchSingleReview(id) {
  console.log("Fetching single review for ID:", id);

  const response = await fetch(SINGLE_REVIEW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),           // same as before
  });

  if (!response.ok) {
    console.error("Failed to fetch review:", await response.text());
    return null;
  }

  const data = await response.json();
  console.log("Single review RAW response:", data);
  return data.value ? data.value[0] : data; // same pattern as before
}

function getReviewIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function normaliseSingleReview(val) {
  // Dedicated normaliser for single review, same style as your original
  const fileName = unwrapMaybeBase64(val.fileName ?? val.FileName ?? "");
  const filePath = unwrapMaybeBase64(val.filePath ?? val.FilePath ?? "");
  const userName = unwrapMaybeBase64(val.userName ?? val.UserName ?? "");
  const userID = unwrapMaybeBase64(val.userID ?? val.UserID ?? "");
  const homeTeam = unwrapMaybeBase64(val.homeTeam ?? val.HomeTeam ?? "");
  const awayTeam = unwrapMaybeBase64(val.awayTeam ?? val.AwayTeam ?? "");
  const comment = unwrapMaybeBase64(val.comment ?? val.Comment ?? "");
  const stars = unwrapMaybeBase64(val.stars ?? val.Stars ?? "0");
  const id = unwrapMaybeBase64(val.id ?? val.Id ?? val.ID ?? val._id ?? "");

  const contentType = val.contentType || val.ContentType || "";
  const url = buildBlobUrl(filePath);

  return {
    id,
    fileName,
    filePath,
    userName,
    userID,
    homeTeam,
    awayTeam,
    comment,
    stars,
    contentType,
    url,
  };
}

async function loadReview() {
  const id = getReviewIdFromUrl();
  if (!id) {
    console.warn("No id found in URL for single review");
    return;
  }

  const rawReview = await fetchSingleReview(id);
  if (!rawReview) {
    console.warn("No review returned from Logic App");
    return;
  }

  const review = normaliseSingleReview(rawReview);
  console.log("Normalised single review:", review);

  const homeTeamEl = document.getElementById("homeTeam");
  const awayTeamEl = document.getElementById("awayTeam");
  const commentEl = document.getElementById("comment");
  const starsEl = document.getElementById("stars");
  const reviewerEl = document.getElementById("reviewer");
  const fileNameEl = document.getElementById("fileName");
  const container = document.getElementById("reviewContainer");

  if (!homeTeamEl || !awayTeamEl || !commentEl || !starsEl || !reviewerEl || !fileNameEl || !container) {
    console.warn("Single review DOM elements missing");
    return;
  }

  homeTeamEl.textContent = review.homeTeam || "";
  awayTeamEl.textContent = review.awayTeam || "";
  commentEl.textContent = review.comment || "";
  starsEl.textContent = review.stars || "";
  reviewerEl.textContent = review.userName || "Anonymous";
  fileNameEl.textContent = review.fileName || "N/A";

  // Use the same media renderer here
  const mediaHtml = renderMedia(review.contentType, review.filePath);
  container.innerHTML += mediaHtml || "";
}

// call on every page; will only do something on reviews.html
loadReview();

// ---------------------------
// DELETE REVIEW
// ---------------------------
function deleteReview(id) {
  if (!id) {
    alert("Missing review id.");
    return;
  }

  if (!confirm("Are you sure you want to delete this review?")) return;

  $.ajax({
    url: DELETE_REVIEW,
    type: "POST",
    data: JSON.stringify({ id }),
    contentType: "application/json",
    success: () => {
      alert("Review deleted.");
      getReviews();
    },
    error: (xhr, status, err) => {
      console.error("Delete failed:", err, xhr?.responseText);
      alert("Failed to delete review. See console for details.");
    },
  });
}

// ---------------------------
// EDIT REVIEW
// ---------------------------
function openEditReview(id) {
  const review = window._allReviews.find((r) => r.id === id);
  if (!review) {
    alert("Review not found.");
    return;
  }

  $("#editReviewId").val(review.id);
  $("#editHomeTeam").val(review.homeTeam);
  $("#editAwayTeam").val(review.awayTeam);
  $("#editComment").val(review.comment);
  $("#editStars").val(review.stars);

  const modalEl = document.getElementById("editReviewModal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

function submitReviewUpdate() {
  const id = $("#editReviewId").val();

  if (!id) {
    alert("Missing review id.");
    return;
  }

  const existing = window._allReviews.find((r) => r.id === id);

  const payload = {
    id,
    homeTeam: $("#editHomeTeam").val(),
    awayTeam: $("#editAwayTeam").val(),
    comment: $("#editComment").val(),
    stars: $("#editStars").val(),
    fileName: existing?.fileName || "",
    filePath: existing?.filePath || "",
    contentType: existing?.contentType || "",
  };

  $.ajax({
    url: UPDATE_REVIEW,
    type: "POST",
    data: JSON.stringify(payload),
    contentType: "application/json",
    success: () => {
      alert("Review updated.");
      getReviews();

      const modalEl = document.getElementById("editReviewModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    },
    error: (xhr, status, err) => {
      console.error("Update failed:", err, xhr?.responseText);
      alert("Failed to update review. See console for details.");
    },
  });
}

// ---------------------------
// MEDIA RENDERING (IMAGE / VIDEO / AUDIO)
// ---------------------------
function renderMedia(contentType, filePath) {
  // No file path → no media
  if (!filePath || filePath.trim() === "" || filePath === "undefined" || filePath === null) {
    return "";
  }

  const url = buildBlobUrl(filePath);

  // If URL is clearly invalid → no media
  if (!url || url.trim() === "" || url.includes("undefined")) {
    return "";
  }

  // IMAGE
  if (!contentType || contentType.startsWith("image/")) {
    return `
      <img src="${url}" 
           onerror="this.style.display='none'" 
           style="width:100%;height:auto;object-fit:cover;">
    `;
  }

  // VIDEO
  if (contentType.startsWith("video/")) {
    return `
      <video width="100%" controls onerror="this.style.display='none'">
        <source src="${url}" type="${contentType}">
      </video>
    `;
  }

  // AUDIO
  if (contentType.startsWith("audio/")) {
    return `
      <audio controls style="width:100%;" onerror="this.style.display='none'">
        <source src="${url}" type="${contentType}">
      </audio>
    `;
  }

  return "";
}


// ---------------------------
// UTILITY FUNCTIONS
// ---------------------------
function buildBlobUrl(filePath) {
  if (!filePath) return "";
  const trimmed = String(filePath).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const left = (BLOB_ACCOUNT || "").replace(/\/+$/g, "");
  const right = trimmed.replace(/^\/+/g, "");
  return `${left}/${right}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unwrapMaybeBase64(value) {
  if (value && typeof value === "object" && "$content" in value) {
    try {
      return atob(value.$content);
    } catch {
      return value.$content || "";
    }
  }
  return value || "";
}

// ---------------------------
// AI IMAGE ANALYSIS
// ---------------------------
function analyseReviewImage(id) {
  const review = window._allReviews.find((r) => r.id === id);
  if (!review) {
    alert("Review not found.");
    return;
  }

  const imageUrl = review.url || buildBlobUrl(review.filePath);
  if (!imageUrl) {
    alert("No image URL found for this review.");
    return;
  }

  const $result = $(`.cv-result[data-review-id="${id}"]`);
  $result.text("Analysing image...");

  $.ajax({
    url: CUSTOM_VISION_LOGICAPP_URL,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ imageUrl }),
    success: (data) => {
      console.log("AI RAW RESPONSE:", data);

      const predictions =
        data?.predictions ||
        data?.body?.predictions ||
        data?.response?.body?.predictions ||
        data?.outputs?.body?.predictions ||
        [];

      if (!predictions.length) {
        $result.text("No predictions returned.");
        return;
      }

      const top = predictions[0];
      const tag = top.tagName || top.tag || "Unknown";
      const prob = (top.probability || 0) * 100;

      $result.text(`AI suggests: ${tag} (${prob.toFixed(1)}%)`);
    },
    error: (xhr, status, err) => {
      console.error("Logic App AI call failed:", status, err, xhr?.responseText);
      $result.text("AI analysis failed. See console.");
    },
  });
}