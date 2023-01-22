function init() {
  $(document).ready(function () {
    console.log("Maggie");
    $.getJSON("load", function (data) {
      if (data != "") {
        localStorage["currentUser"] = data.username;

        $("#login")
          .html(`Hello ${localStorage["currentUser"]}!`)
          .append('<button onclick="logout()" id="button">log out</button>');
        let ul = `<ul style="list-style: none;" id="menu"><li><button name="${name}" id=0 class="list" onclick="loadAlbum(event,0)">My Album</button></li>`;

        for (friend of data["friends"]) {
          ul += `<li><button name=${friend["name"]} id=${friend["id"]} class="list" onclick="loadAlbum(event,0)">${friend["name"]}'s Album</button></li>`;
        }
        ul += "</ul>";
        $(".col-left").html(ul);
      }
    });
  });
}

function login() {
  let name;
  let pw;
  $(document).ready(function () {
    name = $("#name").val();
    pw = $("#password").val();
    if (name && pw) {
      $.post(
        "login",
        { username: name, password: pw },
        function (data, status) {
          if (data == "Login failure") {
            alert(data);
          } else {
            $("#login")
              .html(`Hello ${name}!`)
              .append(
                '<button onclick="logout()" id="button">log out</button>'
              );

            let ul = `<ul style="list-style: none;" id="menu"><li><button name="${name}" id=0 class="list" onclick="loadAlbum(event,0)">My Album</button></li>`;

            for (friend of data["friends"]) {
              ul += `<li><button name=${friend["name"]} id=${friend["id"]} class="list" onclick="loadAlbum(event,0)">${friend["name"]}'s Album</button></li>`;
            }
            ul += "</ul>";
            $(".col-left").html(ul);
          }
          localStorage["currentUser"] = name;
        }
      );

      localStorage.name = 0;
    } else {
      alert("Please enter username and password");
    }
  });
}

function loadAlbum(e, page) {
  let id = e.target.id;
  let name = e.target.getAttribute("name");
  let active = document.getElementsByClassName("active");
  localStorage.name = page;

  if (
    active.length != 0 &&
    e.target.className != "previous" &&
    e.target.className != "next"
  ) {
    active[0].className = active[0].className.replace(" active", "");
  }
  e.target.className != "previous" &&
    e.target.className != "next" &&
    (e.target.className += " active");

  $.get(
    "getalbum",
    { userid: id, pagenum: localStorage.name },
    function (data, status) {
      if (data) {
        let jsonObj = JSON.parse(data);
        let mediaList = jsonObj.data;
        let pageNum = jsonObj.pageNum;
        let col_right = "";
        let likedBy = "";
        for (media of mediaList) {
          let url = media.url;
          let mediaId = media.id;
          likedBy = "Liked by:";
          for (friend of media.likedby) {
            likedBy += ` ${friend} `;
          }
          if (likedBy == "Liked by:") {
            likedBy = "";
          }
          let likeButton = media.likedby.includes(localStorage["currentUser"])
            ? "Unlike"
            : "like";
          if (url.endsWith(".jpg")) {
            col_right += `<div class="media"><img src=${url} onclick="displayPhoto(event, '${name}', '${id}')"><span><p style="display:inline-block; margin-right 5px;">${likedBy}</p>&nbsp&nbsp<button style="display:inline-block" id="${mediaId}" onclick="handleLike(event)" class="like" name="${name}" style="margin-left: 5px">${likeButton}</button></span></div>`;
          } else {
            col_right += `<div class="media"><video onclick="displayVideo(event, '${name}', '${id}')" controls="controls"><source src=${url} type="video/mp4"></video><span><p style="display:inline-block;">${likedBy}</p>&nbsp&nbsp<button style="display:inline-block" id="${mediaId}" onclick="handleLike(event)" class="like" name="${name}" style="margin-left: 5px">${likeButton}</button></span></div>`;
          }
        }

        col_right += `<div class="page_control"><button id="${id}" name="${name}" class="previous" onclick="loadAlbum(event, ${
          page - 1
        })">< Previous Page</button>&nbsp;&nbsp;&nbsp;&nbsp;<button id="${id}" name="${name}" class="next" onclick="loadAlbum(event, ${
          page + 1
        })">Next Page ></button></div>`;

        $(".col-right").html(col_right);
        $(".previous").attr({ disabled: page == 0 });
        $(".next").attr({ disabled: page == pageNum - 1 });

        if (id == 0) {
          $(".like").remove();
        }
      }
    }
  );
}

function handleLike(e) {
  let id = e.target.id;
  $.post("postlike", { photovideoid: id }, function (data, status) {
    let likedBy = "Liked by:";
    for (friend of data) {
      likedBy += " ";
      likedBy += friend;
    }
    if (likedBy == "Liked by:") {
      likedBy = "";
    }
    e.target.previousSibling.previousSibling.innerHTML = likedBy;
    if (data.includes(localStorage["currentUser"])) {
      $(`#${id}`).html("Unlike");
    } else {
      $(`#${id}`).html("like");
    }
  });
}

function displayVideo(e, name, id) {
  let likedBy = e.target.nextSibling;
  $(".col-right").html(
    `<button style="float: right; margin: 10px;" id="${id}" name="${name}" onclick="loadAlbum(event, ${localStorage.name})">X</button>`
  );
  $(".col-right").append(e.target);
  $(".col-right").append(likedBy);
}

function displayPhoto(e, name, id) {
  let likedBy = e.target.nextSibling;
  $(".col-right").html(
    `<button style="float: right; margin: 10px;" id="${id}" name="${name}" onclick="loadAlbum(event, ${localStorage.name})">X</button>`
  );
  $(".col-right").append(e.target);
  $(".col-right").append(likedBy);
}

function logout() {
  $(document).ready(function () {
    $.get("logout", function (data, status) {
      if (data == "") {
        $("#login").html(
          `Username <input type="text" id="name" />&nbsp&nbspPassword<input type="password" id="password" /><button onclick="login()" id="button">login</button>`
        );
        $(".col-left").html("");
        $(".col-right").html("");
        localStorage.clear();
      }
    });
  });
}
