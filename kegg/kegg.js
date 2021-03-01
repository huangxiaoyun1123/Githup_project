// 系统标准库放在前面
const fs = require('fs')
const path = require('path')

// 接着放第三方库
const request = require('syncrequest')
const cheerio = require('cheerio')

// 最后放自己写的模块
const log = console.log.bind(console)

const is_space = function(s) {
    if (s.length === 0) {
        return false
    } else {
        for (let i = 0; i < s.length; i++) {
            let n = s[i]
            if (n !== ' ') {
                return false
            }
        }
    }
    return true
}
const strip_left = function(s) {
    let n = is_space(s)
    let l = s.length
    if (l === 0) {
        return s
    } else if (n === true) {
        return ''
    } else {
        for (let i = 0; i < l; i++) {
            let m = s[i]
            if (is_space(m) === false) {
                return s.slice(i)
            }
        }
    }
}
const strip_right = function(s) {
    let n = is_space(s)
    let l = s.length
    if (l === 0) {
        return s
    } else if (n === true) {
        return ''
    } else {
        for (let i = s.length - 1; i >= 0; i--) {
            let m = s[i]
            if (is_space(m) === false) {
                return s.slice(0, i + 1)
            }
        }
    }
}
const strip = function(s) {
    let i = strip_left(s)
    let j = strip_right(i)
    return j
}
const dictFromDiv = (div) => {
    let e = cheerio.load(div)
    let movie = {}
    let b = e('.list_b')
    let name = b.text().split('\n')[0]
    movie.name = strip(name)
    movie.url = b.find('a').attr('href')
    return movie
}
const ensureDir = (dir) => {
    let exists = fs.existsSync(dir)
    if (!exists) {
        // fs.mkdirSync(dir)
        mkdirsSS(dir)
    }
}
const ensureDirnum = (dir, num) => {
    let exists = fs.existsSync(dir)
    if (!exists) {
        // fs.mkdirSync(dir)
        mkdirsSS(dir)
    } else {
        let k = fs.readdirSync(dir)
        let len = k.length
        log("num, k", num, len)
        if (len === num) {
            return true
        } else {
            return false
        }
    }
}
const cachedUrl = (url, species) => {
    let dir = 'kegg_html'
    let web = 'https://www.genome.jp/kaas-bin/' + url
    ensureDir(dir)
    let filename = species + '.html'
    let cacheFile = path.join(dir, filename)
    let exists = fs.existsSync(cacheFile)
    if (exists) {
        let s = fs.readFileSync(cacheFile)
        return s
    } else {
        let r = request.get.sync(web)
        let body = r.body
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

const mkdirsSS = (dirname) => {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSS(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
const downpic = (name, url, dir) => {
    let r = request.get.sync(url)
    let body = r.body
    let e = cheerio.load(body)
    let pic = e('.image-block').find('img').attr('src')
    let picture = "https://www.kegg.jp/" + pic
    let cover = path.join(dir, name)
    let exists = fs.existsSync(cover)
    log("start", dir)
    // request.sync(picture, { b
    //     pipe: cover,
    // })
    if (!exists) {
        log("restart")
        request.sync(picture, {
            pipe: cover,
        })
    }
}
const koCovers = (div, species, num, dir) => {
    let dict = {}
    let e = cheerio.load(div)
    dict.id = e(".trd").find('a').text()
    dict.url = e(".trd").find('a').attr('href')
    if (dict.id != '') {
        let url = dict.url
        let name = dict.id + '.png'
        downpic(name, url, dir)

    }
}

const moviesFromUrl = (url, species) => {
    let body = cachedUrl(url, species)
    let e = cheerio.load(body)
    let koDivs = e('.trd')
    let num = koDivs.length - 3
    let dir = path.join('kegg_pic', species)
    log("true/false", ensureDirnum(dir, num))
    if (ensureDirnum(dir, num) !== true) {
        for (let i = 0; i < koDivs.length; i++) {
            let div = koDivs[i]
            koCovers(div, species, num, dir)
        }
    }
}
const download_kegg = (species, url) => {
    moviesFromUrl(url, species)
}

const Exist = (exists, web, cacheFile) => {
    if (exists) {
        let s = fs.readFileSync(cacheFile)
        return s
    } else {
        let r = request.get.sync(web)
        let body = r.body
        fs.writeFileSync(cacheFile, body)
        return body
    }
}
const total_web = () => {
    let web = 'https://www.genome.jp/kaas-bin/kaas_main?mode=user&id=1610419583&key=OpiT1T7V'
    let dir = 'total_kegg_html'
    ensureDir(dir)
    let filename = 'total.html'
    let cacheFile = path.join(dir, filename)
    let exists = fs.existsSync(cacheFile)
    let body = Exist(exists, web, cacheFile)
    let e = cheerio.load(body)
    let movieDivs = e('tr')
    let movies = []
    for (let i = 0; i < movieDivs.length; i++) {
        let div = movieDivs[i]
        let m = dictFromDiv(div)
        movies.push(m)
    }
    return movies.slice(1,)
}

const __main = () => {
    let dict = total_web()
    for (let i = 0; i < dict.length; i++) {
        let kegg = dict[i]
        let species = kegg.name
        let url = kegg.url
        download_kegg(species, url)
    }
}



__main()
