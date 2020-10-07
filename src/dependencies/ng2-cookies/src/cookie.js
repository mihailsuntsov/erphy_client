/**
 * Class Cookie - Holds static functions to deal with Cookies
 */
var Cookie = (function () {
    function Cookie() {
    }
    /**
     * Checks the existence of a single cookie by it's name
     *
     * @param  {string} name Identification of the cookie
     * @returns existence of the cookie
     */
    Cookie.check = function (name) {
        name = encodeURIComponent(name);
        var regexp = new RegExp('(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)', 'g');
        var exists = regexp.test(document.cookie);
        return exists;
    };
    /**
     * Retrieves a single cookie by it's name
     *
     * @param  {string} name Identification of the Cookie
     * @returns The Cookie's value
     */
    Cookie.get = function (name) {
        if (Cookie.check(name)) {
            name = encodeURIComponent(name);
            var regexp = new RegExp('(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)', 'g');
            var result = regexp.exec(document.cookie);
            return decodeURIComponent(result[1]);
        }
        else {
            return '';
        }
    };
    /**
     * Retrieves a a list of all cookie avaiable
     *
     * @returns Object with all Cookies
     */
    Cookie.getAll = function () {
        var cookies = {};
        if (document.cookie && document.cookie != '') {
            var split = document.cookie.split(';');
            for (var i = 0; i < split.length; i++) {
                var currCookie = split[i].split('=');
                currCookie[0] = currCookie[0].replace(/^ /, '');
                cookies[decodeURIComponent(currCookie[0])] = decodeURIComponent(currCookie[1]);
            }
        }
        return cookies;
    };
    /**
     * Save the Cookie
     *
     * @param  {string} name Cookie's identification
     * @param  {string} value Cookie's value
     * @param  {number} expires Cookie's expiration date in days from now or at a specific date from a Date object. If it's undefined the cookie is a session Cookie
     * @param  {string} path Path relative to the domain where the cookie should be avaiable. Default /
     * @param  {string} domain Domain where the cookie should be avaiable. Default current domain
     * @param  {boolean} secure If true, the cookie will only be available through a secured connection
     */
    Cookie.set = function (name, value, expires, path, domain, secure) {
        var cookieStr = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';';
        if (expires) {
            if (typeof expires === 'number') {
                var dtExpires = new Date(new Date().getTime() + expires * 1000 * 60 * 60 * 24);
                cookieStr += 'expires=' + dtExpires.toUTCString() + ';';
            }
            else {
                cookieStr += 'expires=' + expires.toUTCString() + ';';
            }
        }
        if (path) {
            cookieStr += 'path=' + path + ';';
        }
        if (domain) {
            cookieStr += 'domain=' + domain + ';';
        }
        if (secure) {
            cookieStr += 'secure;';
        }
        // console.log(cookieStr);
        document.cookie = cookieStr;
    };
    /**
     * Removes specified Cookie
     *
     * @param  {string} name Cookie's identification
     * @param  {string} path Path relative to the domain where the cookie should be avaiable. Default /
     * @param  {string} domain Domain where the cookie should be avaiable. Default current domain
     */
    Cookie.delete = function (name, path, domain) {
        Cookie.set(name, '', -1, path, domain);
    };
    /**
     * Delete all cookie avaiable
     */
    Cookie.deleteAll = function (path, domain) {
        var cookies = Cookie.getAll();
        for (var cookieName in cookies) {
            Cookie.delete(cookieName, path, domain);
        }
    };
    return Cookie;
}());
export { Cookie };
//# sourceMappingURL=cookie.js.map