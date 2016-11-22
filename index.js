var textarea = [],
    safe = document.cookie.match(/safe=true/) ? true : false; // if true, limit consecutive hidden characters to 10 for Linux X11 clipboard

function embedText() {
    var coverStr = textarea[2].value,
        encodedStr = encodeText('T\0' + textarea[3].value),
        outputStr = '',
        i = 0,
        j = 0;
    // Distribute 10 encoded characters between each cover character
    while (i < coverStr.length-1) {
        outputStr += coverStr[i++];
        for (; j < i * 10; j++)
            if (encodedStr[j])
                outputStr += encodedStr[j];
    }
    if (!safe) {
        if (j < encodedStr.length)
            // Pack in remaining encoded characters
            outputStr += encodedStr.slice(j);
    } else {
        var warn = document.getElementById('warn');
        if (j < encodedStr.length) {
            warn.style.visibility = 'visible';
            warn.innerHTML = 'Please provide ' + Math.ceil(encodedStr.slice(j).length / 10) + ' more characters of cover text to store entire message';
        } else
            warn.style.visibility = 'hidden';
    }
    if (coverStr.length > 0) {
        outputStr += coverStr[i];
        textarea[3].readOnly = false;
    } else if (!encodedStr[9]) {
        outputStr = '';
        textarea[3].readOnly = true;
    }
    textarea[4].value = outputStr;
    resizeTextarea(textarea[4]);
    textarea[4].classList.add('encode');
    window.setTimeout(function() {
        textarea[4].classList.remove('encode');
    }, 200);
}

function encodeText(str) {
    var strBytes = stringToBytes(str),
        outputStr = '',
        encodingChars = [
            '\u200B', // zero width space
            '\u200C', // zero width non-joiner
            '\u200D', // zero width joiner
            '\uFEFF'  // zero width non-breaking space
        ];
    for (var i = 0, sLen = str.length; i < sLen; i++)
        for (var j = 6; j >= 0; j -= 2)
            outputStr += encodingChars[(strBytes[i] >> j) & 0x3];
    return outputStr;
}

function decodeText() {
    textarea[0].maxLength = 0x7FFFFFFF;
    window.setTimeout(function() {
        // Discard cover text
        var hiddenStr = textarea[0].value.match(/[\u200B\u200C\u200D\uFEFF]/g),
            outputStr = '',
            encodingVals = {
                '\u200B':0,
                '\u200C':1,
                '\u200D':2,
                '\uFEFF':3
            };
        if (hiddenStr != null) {
            for (var i = 0, sLen = hiddenStr.length; i < sLen; i += 4) {
                var charCode = 0;
                for (var j = 0; j < 4; j++)
                    charCode += encodingVals[hiddenStr[i + j]] << (6 - j * 2);
                outputStr += String.fromCharCode(charCode);
            }
        }
        if (outputStr.slice(0, 2) == 'T\0') {
            textarea[1].value = outputStr.slice(2);
            resizeTextarea(textarea[1]);
            textarea[1].classList.add('decode');
            window.setTimeout(function() {
                textarea[1].classList.remove('decode');
            }, 1000);
        } else
            console.log('Only text extraction is supported at this time.')
    }, 1);
}

// Credit: http://stackoverflow.com/questions/1240408/reading-bytes-from-a-javascript-string
function stringToBytes(str) {
    var byteArray = [];
    for (var i = 0; i < str.length; i++)
        if (str.charCodeAt(i) <= 0x7F)
            byteArray.push(str.charCodeAt(i));
        else {
            var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
            for (var j = 0; j < h.length; j++)
                byteArray.push(parseInt(h[j], 16));
        }
    return byteArray;
}

function clearIn() {
    textarea[0].value = '';
    textarea[1].value = '';
    resizeTextarea(textarea[0]);
    resizeTextarea(textarea[1]);
    textarea[0].focus();
}

function clearOut() {
    textarea[2].value = '';
    resizeTextarea(textarea[2]);
    embedText();
    textarea[2].focus();
}

function clearOutSecret() {
    textarea[3].value = '';
    resizeTextarea(textarea[3]);
    embedText();
    textarea[3].focus();
}

function notifyCopy(ta, copied) {
    var copiedBanner = document.getElementById(copied);
    textarea[ta].classList.add('copy');
    copiedBanner.classList.add('show')
    window.setTimeout(function() {
        textarea[ta].classList.remove('copy');
        copiedBanner.classList.remove('show');
    }, 800)
}

function resizeBody() {
    document.body.style.fontSize = Math.min(window.innerWidth, window.innerHeight) * 0.03 + 'px';
    for (var i = 0; i < 5; i++)
        resizeTextarea(textarea[i]);
}

function resizeTextarea(el) {
    var fontSize = parseFloat(document.body.style.fontSize);
    el.style.height = '';
    el.style.height = Math.min(el.scrollHeight + fontSize * 0.3, fontSize * 12) + 'px';
}

function toggleSafe() {
    safe = !safe;
    if (safe) {
        document.cookie = 'safe=true';
        embedText();
    } else {
        document.cookie = 'safe=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
        document.getElementById('warn').style.visibility = 'hidden';
    }
}

window.addEventListener('keyup', function(e) {
    // Select textareas with keys
    if (e.altKey)
        switch (e.keyCode) {
            case 65: // Alt+A
                textarea[0].focus();
                break;
            case 90: // Alt+Z
                textarea[1].focus();
                document.getElementById('in-copy').click();
                break;
            case 87: // Alt+W
                textarea[2].focus();
                break;
            case 83: // Alt+S
                textarea[3].focus();
                break;
            case 88: // Alt+X
                textarea[4].focus();
        }
}, false);

document.onreadystatechange = function() {
    var textareas = ['in-cipher',
                     'in-hidden',
                     'out-cover',
                     'out-hidden',
                     'out-cipher'
        ];
    for (var i = 0; i < 5; i++)
        textarea[i] = document.getElementById(textareas[i]);
    if (safe)
        document.getElementById('toggle-safe').checked = true;

    resizeBody();
    new Clipboard('.copy');

    if (navigator.userAgent.match(/Mac|iP(hone|od|ad)/)) {
        textarea[0].placeholder = 'Paste [Command+V] input ciphertext';
        textarea[4].placeholder = 'Copy [Command+C] output ciphertext';
    }
}
