!function(e){var n={};function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:r})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(t.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)t.d(r,o,function(n){return e[n]}.bind(null,o));return r},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="",t(t.s=416)}({4:function(e,n,t){"use strict";t.d(n,"k",(function(){return E})),t.d(n,"i",(function(){return L})),t.d(n,"f",(function(){return d})),t.d(n,"h",(function(){return d})),t.d(n,"b",(function(){return v})),t.d(n,"g",(function(){return y})),t.d(n,"a",(function(){return m})),t.d(n,"d",(function(){return F})),t.d(n,"e",(function(){return H})),t.d(n,"l",(function(){return S})),t.d(n,"c",(function(){return M})),t.d(n,"j",(function(){return r}));var r,o,l,_,u,i,c={},s=[],f=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function p(e,n){for(var t in n)e[t]=n[t];return e}function a(e){var n=e.parentNode;n&&n.removeChild(e)}function d(e,n,t){var r,o=arguments,l={};for(r in n)"key"!==r&&"ref"!==r&&(l[r]=n[r]);if(arguments.length>3)for(t=[t],r=3;r<arguments.length;r++)t.push(o[r]);if(null!=t&&(l.children=t),"function"==typeof e&&null!=e.defaultProps)for(r in e.defaultProps)void 0===l[r]&&(l[r]=e.defaultProps[r]);return h(e,l,n&&n.key,n&&n.ref,null)}function h(e,n,t,o,l){var _={type:e,props:n,key:t,ref:o,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,constructor:void 0,__v:l};return null==l&&(_.__v=_),r.vnode&&r.vnode(_),_}function y(){return{current:null}}function v(e){return e.children}function m(e,n){this.props=e,this.context=n}function g(e,n){if(null==n)return e.__?g(e.__,e.__.__k.indexOf(e)+1):null;for(var t;n<e.__k.length;n++)if(null!=(t=e.__k[n])&&null!=t.__e)return t.__e;return"function"==typeof e.type?g(e):null}function b(e){var n,t;if(null!=(e=e.__)&&null!=e.__c){for(e.__e=e.__c.base=null,n=0;n<e.__k.length;n++)if(null!=(t=e.__k[n])&&null!=t.__e){e.__e=e.__c.base=t.__e;break}return b(e)}}function k(e){(!e.__d&&(e.__d=!0)&&o.push(e)&&!x.__r++||_!==r.debounceRendering)&&((_=r.debounceRendering)||l)(x)}function x(){for(var e;x.__r=o.length;)e=o.sort((function(e,n){return e.__v.__b-n.__v.__b})),o=[],e.some((function(e){var n,t,r,o,l,_,u;e.__d&&(_=(l=(n=e).__v).__e,(u=n.__P)&&(t=[],(r=p({},l)).__v=r,o=U(u,l,r,n.__n,void 0!==u.ownerSVGElement,null,t,null==_?g(l):_),j(t,l),o!=_&&b(l)))}))}function w(e,n,t,r,o,l,_,u,i,f){var p,d,y,m,b,k,x,w=r&&r.__k||s,S=w.length;for(i==c&&(i=null!=_?_[0]:S?g(r,0):null),t.__k=[],p=0;p<n.length;p++)if(null!=(m=t.__k[p]=null==(m=n[p])||"boolean"==typeof m?null:"string"==typeof m||"number"==typeof m?h(null,m,null,null,m):Array.isArray(m)?h(v,{children:m},null,null,null):null!=m.__e||null!=m.__c?h(m.type,m.props,m.key,null,m.__v):m)){if(m.__=t,m.__b=t.__b+1,null===(y=w[p])||y&&m.key==y.key&&m.type===y.type)w[p]=void 0;else for(d=0;d<S;d++){if((y=w[d])&&m.key==y.key&&m.type===y.type){w[d]=void 0;break}y=null}b=U(e,m,y=y||c,o,l,_,u,i,f),(d=m.ref)&&y.ref!=d&&(x||(x=[]),y.ref&&x.push(y.ref,null,m),x.push(d,m.__c||b,m)),null!=b?(null==k&&(k=b),i=P(e,m,y,w,_,b,i),"option"==t.type?e.value="":"function"==typeof t.type&&(t.__d=i)):i&&y.__e==i&&i.parentNode!=e&&(i=g(y))}if(t.__e=k,null!=_&&"function"!=typeof t.type)for(p=_.length;p--;)null!=_[p]&&a(_[p]);for(p=S;p--;)null!=w[p]&&M(w[p],w[p]);if(x)for(p=0;p<x.length;p++)D(x[p],x[++p],x[++p])}function S(e){return null==e||"boolean"==typeof e?[]:Array.isArray(e)?s.concat.apply([],e.map(S)):[e]}function P(e,n,t,r,o,l,_){var u,i,c;if(void 0!==n.__d)u=n.__d,n.__d=void 0;else if(o==t||l!=_||null==l.parentNode)e:if(null==_||_.parentNode!==e)e.appendChild(l),u=null;else{for(i=_,c=0;(i=i.nextSibling)&&c<r.length;c+=2)if(i==l)break e;e.insertBefore(l,_),u=_}return void 0!==u?u:l.nextSibling}function C(e,n,t){"-"===n[0]?e.setProperty(n,t):e[n]="number"==typeof t&&!1===f.test(n)?t+"px":null==t?"":t}function T(e,n,t,r,o){var l,_,u,i,c;if(o?"className"===n&&(n="class"):"class"===n&&(n="className"),"style"===n)if(l=e.style,"string"==typeof t)l.cssText=t;else{if("string"==typeof r&&(l.cssText="",r=null),r)for(i in r)t&&i in t||C(l,i,"");if(t)for(c in t)r&&t[c]===r[c]||C(l,c,t[c])}else"o"===n[0]&&"n"===n[1]?(_=n!==(n=n.replace(/Capture$/,"")),u=n.toLowerCase(),n=(u in e?u:n).slice(2),t?(r||e.addEventListener(n,N,_),(e.l||(e.l={}))[n]=t):e.removeEventListener(n,N,_)):"list"!==n&&"tagName"!==n&&"form"!==n&&"type"!==n&&"size"!==n&&!o&&n in e?e[n]=null==t?"":t:"function"!=typeof t&&"dangerouslySetInnerHTML"!==n&&(n!==(n=n.replace(/^xlink:?/,""))?null==t||!1===t?e.removeAttributeNS("http://www.w3.org/1999/xlink",n.toLowerCase()):e.setAttributeNS("http://www.w3.org/1999/xlink",n.toLowerCase(),t):null==t||!1===t&&!/^ar/.test(n)?e.removeAttribute(n):e.setAttribute(n,t))}function N(e){this.l[e.type](r.event?r.event(e):e)}function O(e,n,t){var r,o;for(r=0;r<e.__k.length;r++)(o=e.__k[r])&&(o.__=e,o.__e&&("function"==typeof o.type&&o.__k.length>1&&O(o,n,t),n=P(t,o,o,e.__k,null,o.__e,n),"function"==typeof e.type&&(e.__d=n)))}function U(e,n,t,o,l,_,u,i,c){var s,f,a,d,h,y,g,b,k,x,S,P=n.type;if(void 0!==n.constructor)return null;(s=r.__b)&&s(n);try{e:if("function"==typeof P){if(b=n.props,k=(s=P.contextType)&&o[s.__c],x=s?k?k.props.value:s.__:o,t.__c?g=(f=n.__c=t.__c).__=f.__E:("prototype"in P&&P.prototype.render?n.__c=f=new P(b,x):(n.__c=f=new m(b,x),f.constructor=P,f.render=W),k&&k.sub(f),f.props=b,f.state||(f.state={}),f.context=x,f.__n=o,a=f.__d=!0,f.__h=[]),null==f.__s&&(f.__s=f.state),null!=P.getDerivedStateFromProps&&(f.__s==f.state&&(f.__s=p({},f.__s)),p(f.__s,P.getDerivedStateFromProps(b,f.__s))),d=f.props,h=f.state,a)null==P.getDerivedStateFromProps&&null!=f.componentWillMount&&f.componentWillMount(),null!=f.componentDidMount&&f.__h.push(f.componentDidMount);else{if(null==P.getDerivedStateFromProps&&b!==d&&null!=f.componentWillReceiveProps&&f.componentWillReceiveProps(b,x),!f.__e&&null!=f.shouldComponentUpdate&&!1===f.shouldComponentUpdate(b,f.__s,x)||n.__v===t.__v){f.props=b,f.state=f.__s,n.__v!==t.__v&&(f.__d=!1),f.__v=n,n.__e=t.__e,n.__k=t.__k,f.__h.length&&u.push(f),O(n,i,e);break e}null!=f.componentWillUpdate&&f.componentWillUpdate(b,f.__s,x),null!=f.componentDidUpdate&&f.__h.push((function(){f.componentDidUpdate(d,h,y)}))}f.context=x,f.props=b,f.state=f.__s,(s=r.__r)&&s(n),f.__d=!1,f.__v=n,f.__P=e,s=f.render(f.props,f.state,f.context),f.state=f.__s,null!=f.getChildContext&&(o=p(p({},o),f.getChildContext())),a||null==f.getSnapshotBeforeUpdate||(y=f.getSnapshotBeforeUpdate(d,h)),S=null!=s&&s.type==v&&null==s.key?s.props.children:s,w(e,Array.isArray(S)?S:[S],n,t,o,l,_,u,i,c),f.base=n.__e,f.__h.length&&u.push(f),g&&(f.__E=f.__=null),f.__e=!1}else null==_&&n.__v===t.__v?(n.__k=t.__k,n.__e=t.__e):n.__e=A(t.__e,n,t,o,l,_,u,c);(s=r.diffed)&&s(n)}catch(e){n.__v=null,r.__e(e,n,t)}return n.__e}function j(e,n){r.__c&&r.__c(n,e),e.some((function(n){try{e=n.__h,n.__h=[],e.some((function(e){e.call(n)}))}catch(e){r.__e(e,n.__v)}}))}function A(e,n,t,r,o,l,_,u){var i,f,p,a,d,h=t.props,y=n.props;if(o="svg"===n.type||o,null!=l)for(i=0;i<l.length;i++)if(null!=(f=l[i])&&((null===n.type?3===f.nodeType:f.localName===n.type)||e==f)){e=f,l[i]=null;break}if(null==e){if(null===n.type)return document.createTextNode(y);e=o?document.createElementNS("http://www.w3.org/2000/svg",n.type):document.createElement(n.type,y.is&&{is:y.is}),l=null,u=!1}if(null===n.type)h!==y&&e.data!=y&&(e.data=y);else{if(null!=l&&(l=s.slice.call(e.childNodes)),p=(h=t.props||c).dangerouslySetInnerHTML,a=y.dangerouslySetInnerHTML,!u){if(null!=l)for(h={},d=0;d<e.attributes.length;d++)h[e.attributes[d].name]=e.attributes[d].value;(a||p)&&(a&&p&&a.__html==p.__html||(e.innerHTML=a&&a.__html||""))}(function(e,n,t,r,o){var l;for(l in t)"children"===l||"key"===l||l in n||T(e,l,null,t[l],r);for(l in n)o&&"function"!=typeof n[l]||"children"===l||"key"===l||"value"===l||"checked"===l||t[l]===n[l]||T(e,l,n[l],t[l],r)})(e,y,h,o,u),a?n.__k=[]:(i=n.props.children,w(e,Array.isArray(i)?i:[i],n,t,r,"foreignObject"!==n.type&&o,l,_,c,u)),u||("value"in y&&void 0!==(i=y.value)&&i!==e.value&&T(e,"value",i,h.value,!1),"checked"in y&&void 0!==(i=y.checked)&&i!==e.checked&&T(e,"checked",i,h.checked,!1))}return e}function D(e,n,t){try{"function"==typeof e?e(n):e.current=n}catch(e){r.__e(e,t)}}function M(e,n,t){var o,l,_;if(r.unmount&&r.unmount(e),(o=e.ref)&&(o.current&&o.current!==e.__e||D(o,null,n)),t||"function"==typeof e.type||(t=null!=(l=e.__e)),e.__e=e.__d=void 0,null!=(o=e.__c)){if(o.componentWillUnmount)try{o.componentWillUnmount()}catch(e){r.__e(e,n)}o.base=o.__P=null}if(o=e.__k)for(_=0;_<o.length;_++)o[_]&&M(o[_],n,t);null!=l&&a(l)}function W(e,n,t){return this.constructor(e,t)}function E(e,n,t){var o,l,_;r.__&&r.__(e,n),l=(o=t===u)?null:t&&t.__k||n.__k,e=d(v,null,[e]),_=[],U(n,(o?n:t||n).__k=e,l||c,c,void 0!==n.ownerSVGElement,t&&!o?[t]:l?null:n.childNodes.length?s.slice.call(n.childNodes):null,_,t||c,o),j(_,e)}function L(e,n){E(e,n,u)}function F(e,n){var t,r;for(r in n=p(p({},e.props),n),arguments.length>2&&(n.children=s.slice.call(arguments,2)),t={},n)"key"!==r&&"ref"!==r&&(t[r]=n[r]);return h(e.type,t,n.key||e.key,n.ref||e.ref,null)}function H(e){var n={},t={__c:"__cC"+i++,__:e,Consumer:function(e,n){return e.children(n)},Provider:function(e){var r,o=this;return this.getChildContext||(r=[],this.getChildContext=function(){return n[t.__c]=o,n},this.shouldComponentUpdate=function(e){o.props.value!==e.value&&r.some((function(n){n.context=e.value,k(n)}))},this.sub=function(e){r.push(e);var n=e.componentWillUnmount;e.componentWillUnmount=function(){r.splice(r.indexOf(e),1),n&&n.call(e)}}),e.children}};return t.Consumer.contextType=t,t.Provider.__=t,t}r={__e:function(e,n){for(var t,r;n=n.__;)if((t=n.__c)&&!t.__)try{if(t.constructor&&null!=t.constructor.getDerivedStateFromError&&(r=!0,t.setState(t.constructor.getDerivedStateFromError(e))),null!=t.componentDidCatch&&(r=!0,t.componentDidCatch(e)),r)return k(t.__E=t)}catch(n){e=n}throw e}},m.prototype.setState=function(e,n){var t;t=this.__s!==this.state?this.__s:this.__s=p({},this.state),"function"==typeof e&&(e=e(t,this.props)),e&&p(t,e),null!=e&&this.__v&&(n&&this.__h.push(n),k(this))},m.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),k(this))},m.prototype.render=v,o=[],l="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,x.__r=0,u=c,i=0},416:function(e,n,t){"use strict";t.r(n),t.d(n,"Welcome2TH",(function(){return o}));var r=t(4);function o(e){return Object(r.h)("div",{style:"width=200px"},Object(r.h)("spam",null,"Welcome to Thread Helper! 🧵 Just open Twitter and you should see our sidebar :)."))}Object(r.k)(Object(r.h)(o,null),document.body)}});
//# sourceMappingURL=popup.js.map