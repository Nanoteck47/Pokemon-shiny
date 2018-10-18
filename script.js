let elm = {};
let pmsByFamily = pms.reduce((all, pm) => {
  if (!all[pm.family]) {
    all[pm.family] = {
      key: pm.dex,
      pms: [],
      shiny: pm.shiny_released,
      family: pm.family,
    };
  }
  all[pm.family].pms.push(pm);
  return all;
}, {});


let totalShiny = 0;

let lang = /^zh/.test(navigator.language) ? 'zh' : 'en';
let _name = (lang === 'en') ? 'name_en' : 'name';
document.documentElement.lang = (lang === 'zh') ? 'zh-TW' : 'en-US';

// l10n
function getL10n(l10nID) {
  return (l10n[l10nID] && l10n[l10nID][lang]) || l10nID;
}

document.querySelectorAll('[data-l10n]').forEach(element => {
  let l10nID = element.dataset.l10n;
  element.dataset.l10nDone = '1';
  element.innerText = getL10n(l10nID);
});


let html = Object.values(pmsByFamily)
  .filter(family => family.pms[0].shiny_released)
  .map(family => {
    let pmDom = family.pms.map(pm => {
      if (!pm.shiny_released) { return; }
      totalShiny += 1;
      return (
        `<label
          class="pm"
          title="#${pm.dex} ${pm.name_en}"
          style="${pm.order ? 'order: ' + pm.order : ''}"
        >
          <input class="sr-only pm-checkbox" type="checkbox" data-dex="${pm.dex}" />
          <div class="pm-info"
            data-dex="${pm.dex}"
            data-name="${pm[_name]}"
            style="background-image: url(${getImgUrl(pm.dex)});"
          ></div>
        </label>`
      );
    }).join('');

    return `<div class="pm-group">${pmDom}</div>`;
  }).join('');


let shinyDex = [];
elm.checkList = document.querySelector('.pm-checklist');
elm.checkList.innerHTML = html;
elm.checkList.addEventListener('change', (e) => {
  let pm = e.target;
  let dex = +pm.dataset.dex;
  let checked = pm.checked;

  shinyDex[dex] = pm.checked;
  updateState();
});


let checkboxArr = [];
elm.checkboxs = document.querySelectorAll('.pm-checkbox');
elm.checkboxs.forEach(checkbox => {
  checkboxArr[+checkbox.dataset.dex] = checkbox;
});


elm.nickname = document.querySelector('.nickname');
elm.nickname.addEventListener('input', updateState);


document.querySelector('.counter [data-total]').dataset.total = totalShiny;
elm.counter = document.querySelector('.counter [data-counter]');
function updateShinyCounter() {
  elm.counter.dataset.counter = getArrayIndex(shinyDex).length;
}


function getArrayIndex(arr) {
  return arr.map((i, v) => i ? v : i).filter(Boolean);
}

let splitChar = '-';
function updateState() {
  let para = new URLSearchParams({
    dex: getArrayIndex(shinyDex).join(splitChar),
    nickname: elm.nickname.value || '',
  });
  history.pushState(null, null, `?${para.toString()}`);
  elm.getShortUrl.removeAttribute('href');
  updateShinyCounter();
}


function renderState() {
  let para = new URLSearchParams(location.search.replace(/^\?/, ''));

  let _nickname = para.get('nickname');
  elm.nickname.value = _nickname;

  let checkedDex = (para.get('dex') || '').split(splitChar).map(d => +d);
  checkboxArr.forEach((box, dex) => {
    let isChecked = (checkedDex.indexOf(dex) !== -1);
    box.checked = isChecked;
    shinyDex[dex] = isChecked;
  });
  updateShinyCounter();
}


function getImgUrl(dex) {
  return `//images.weserv.nl/?w=200&il&url=raw.githubusercontent.com/ZeChrales/PogoAssets/master/pokemon_icons/pokemon_icon_${(dex + '').padStart(3, '0')}_00_shiny.png`;
}


elm.share = document.querySelector('.share');
elm.share.addEventListener('click', (e) => {
  e.preventDefault();
  shareLink();
});

function toggleFectingClass() {
  elm.getShortUrl.classList.toggle('is-fetching');
}

elm.getShortUrl = document.querySelector('.get-shorturl');
elm.getShortUrl.addEventListener('click', (e) => {
  e.preventDefault();
  if (elm.getShortUrl.classList.contains('is-fetching')) {
    return;
  }
  let url = elm.getShortUrl.href;
  if (url) {
    shareLink(url);
    return;
  }

  toggleFectingClass();
  getShortedUrl()
  .then(d => {
    toggleFectingClass();
    elm.getShortUrl.href = d;
  })
  .catch(() => {
    toggleFectingClass();
  });
});

function getShortedUrl() {
  return fetch(`https://script.google.com/macros/s/AKfycbzpbnnYoIv28lkcezbaj170ot7nNkHZMUvI7FI5UBUaQrdD3Kw/exec?url=${encodeURIComponent(location.href)}`).then(d => d.text());
}

function shareLink(url) {
  url = url || location.href;
  let title = 'Pokemon Shiny Checklist';
  let who = 'my';
  if (elm.nickname.value) {
    who = `${elm.nickname.value}'s`;
    title = `${elm.nickname.value}'s ${title}`;
  }
  if (!navigator.share) {
    window.prompt(getL10n('share-url-directly'), url);
    return;
  }


  navigator.share({
    title: title,
    text: `Here are ${who} shiny pokemon.`,
    url: url,
  });
}


elm.reset = document.querySelector('.reset');
elm.reset.addEventListener('click', (e) => {
  e.preventDefault();
  if (window.confirm(getL10n('confirm-to-reset'))) {
    location.href = './';
  }
});

window.addEventListener('popstate', renderState);
renderState();
