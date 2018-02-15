(function webpackUniversalModuleDefinition(root,factory){if(typeof exports==="object"&&typeof module==="object")module.exports=factory();else if(typeof define==="function"&&define.amd)define([],factory);else{var a=factory();for(var i in a)(typeof exports==="object"?exports:root)[i]=a[i]}})(typeof self!=="undefined"?self:this,function(){return function(modules){var installedModules={};function __webpack_require__(moduleId){if(installedModules[moduleId]){return installedModules[moduleId].exports}var module=installedModules[moduleId]={i:moduleId,l:false,exports:{}};modules[moduleId].call(module.exports,module,module.exports,__webpack_require__);module.l=true;return module.exports}__webpack_require__.m=modules;__webpack_require__.c=installedModules;__webpack_require__.d=function(exports,name,getter){if(!__webpack_require__.o(exports,name)){Object.defineProperty(exports,name,{configurable:false,enumerable:true,get:getter})}};__webpack_require__.n=function(module){var getter=module&&module.__esModule?function getDefault(){return module["default"]}:function getModuleExports(){return module};__webpack_require__.d(getter,"a",getter);return getter};__webpack_require__.o=function(object,property){return Object.prototype.hasOwnProperty.call(object,property)};__webpack_require__.p="";return __webpack_require__(__webpack_require__.s=0)}([function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var KeyBindings;(function(KeyBindings){KeyBindings["moveUp"]="up";KeyBindings["moveDown"]="down";KeyBindings["moveRight"]="right";KeyBindings["moveLeft"]="left";KeyBindings["pageUp"]="pageup";KeyBindings["pageDown"]="pagedown";KeyBindings["home"]="home";KeyBindings["end"]="end";KeyBindings["ctrlHome"]="ctrl+home";KeyBindings["ctrlEnd"]="ctrl+end"})(KeyBindings=exports.KeyBindings||(exports.KeyBindings={}));var Mousetrap=function(){function Mousetrap(targetElement,useCapture){var _this=this;this._callbacks={};this._directMap={};this._sequenceLevels={};this._ignoreNextKeyup=false;this._ignoreNextKeypress=false;this._nextExpectedAction=false;this.addKeycodes=function(object){for(var key in object){if(object.hasOwnProperty(key)){Mousetrap._MAP[key]=object[key]}}Mousetrap._REVERSE_MAP=null};this.target=targetElement||window.document;Mousetrap._mapSpecialKeys();var scopepHandleKeyEvent=function(e){return _this._handleKeyEvent(e)};Mousetrap._addEvent(targetElement,"keypress",scopepHandleKeyEvent,useCapture);Mousetrap._addEvent(targetElement,"keydown",scopepHandleKeyEvent,useCapture);Mousetrap._addEvent(targetElement,"keyup",scopepHandleKeyEvent,useCapture);this.destroy=function(){Mousetrap._removeEvent(targetElement,"keypress",scopepHandleKeyEvent);Mousetrap._removeEvent(targetElement,"keydown",scopepHandleKeyEvent);Mousetrap._removeEvent(targetElement,"keyup",scopepHandleKeyEvent);_this.reset()}}Mousetrap._mapSpecialKeys=function(){for(var i=1;i<20;++i){Mousetrap._MAP[111+i]="f"+i}for(var i=0;i<=9;++i){Mousetrap._MAP[i+96]=i.toString()}};Mousetrap._addEvent=function(object,type,callback,useCapture){if(object.addEventListener){object.addEventListener(type,callback,useCapture||false);return}object.attachEvent("on"+type,callback)};Mousetrap._removeEvent=function(object,type,callback){if(object.removeEventListener){object.removeEventListener(type,callback,false);return}object.detachEvent("on"+type,callback)};Mousetrap._characterFromEvent=function(e){if(e.type==="keypress"){var character=String.fromCharCode(e.which);if(!e.shiftKey){character=character.toLowerCase()}return character}if(Mousetrap._MAP[e.which]){return Mousetrap._MAP[e.which]}if(Mousetrap._KEYCODE_MAP[e.which]){return Mousetrap._KEYCODE_MAP[e.which]}return String.fromCharCode(e.which).toLowerCase()};Mousetrap._modifiersMatch=function(modifiers1,modifiers2){return modifiers1.sort().join(",")===modifiers2.sort().join(",")};Mousetrap._eventModifiers=function(e){var modifiers=[];if(e.shiftKey){modifiers.push("shift")}if(e.altKey){modifiers.push("alt")}if(e.ctrlKey){modifiers.push("ctrl")}if(e.metaKey){modifiers.push("meta")}return modifiers};Mousetrap._preventDefault=function(e){if(e.preventDefault){e.preventDefault();return}e.returnValue=false};Mousetrap._stopPropagation=function(e){if(e.stopPropagation){e.stopPropagation();return}e.cancelBubble=true};Mousetrap._isModifier=function(key){return key==="shift"||key==="ctrl"||key==="alt"||key==="meta"};Mousetrap._getReverseMap=function(){if(!Mousetrap._REVERSE_MAP){Mousetrap._REVERSE_MAP={};for(var key in Mousetrap._MAP){if(key>95&&key<112){continue}if(Mousetrap._MAP.hasOwnProperty(key)){Mousetrap._REVERSE_MAP[Mousetrap._MAP[key]]=key}}}return Mousetrap._REVERSE_MAP};Mousetrap._pickBestAction=function(key,modifiers,action){if(!action){action=Mousetrap._getReverseMap()[key]?"keydown":"keypress"}if(action==="keypress"&&modifiers.length){action="keydown"}return action};Mousetrap._keysFromString=function(combination){if(combination==="+"){return["+"]}combination=combination.replace(/\+{2}/g,"+plus");return combination.split("+")};Mousetrap._getKeyInfo=function(combination,action){var keys;var key;var i;var modifiers=[];keys=Mousetrap._keysFromString(combination);for(i=0;i<keys.length;++i){key=keys[i];if(Mousetrap._SPECIAL_ALIASES[key]){key=Mousetrap._SPECIAL_ALIASES[key]}if(action&&action!=="keypress"&&Mousetrap._SHIFT_MAP[key]){key=Mousetrap._SHIFT_MAP[key];modifiers.push("shift")}if(Mousetrap._isModifier(key)){modifiers.push(key)}}action=Mousetrap._pickBestAction(key,modifiers,action);return{key:key,modifiers:modifiers,action:action}};Mousetrap._belongsTo=function(element,ancestor){if(element===null||element===window.document){return false}if(element===ancestor){return true}return Mousetrap._belongsTo(element.parentNode,ancestor)};Mousetrap.prototype._resetSequences=function(doNotReset){if(doNotReset===void 0){doNotReset={}}var activeSequences=false;for(var key in this._sequenceLevels){if(doNotReset[key]){activeSequences=true;continue}this._sequenceLevels[key]=0}if(!activeSequences){this._nextExpectedAction=false}};Mousetrap.prototype._getMatches=function(character,modifiers,e,sequenceName,combination,level){var i;var callback;var matches=[];var action=e.type;if(!this._callbacks[character]){return[]}if(action==="keyup"&&Mousetrap._isModifier(character)){modifiers=[character]}for(i=0;i<this._callbacks[character].length;++i){callback=this._callbacks[character][i];if(!sequenceName&&callback.seq&&this._sequenceLevels[callback.seq]!==callback.level){continue}if(action!==callback.action){continue}if(action==="keypress"&&!e.metaKey&&!e.ctrlKey||Mousetrap._modifiersMatch(modifiers,callback.modifiers)){var deleteCombo=!sequenceName&&callback.combo===combination;var deleteSequence=sequenceName&&callback.seq===sequenceName&&callback.level===level;if(deleteCombo||deleteSequence){this._callbacks[character].splice(i,1)}matches.push(callback)}}return matches};Mousetrap.prototype._fireCallback=function(callback,e,combo){if(this.stopCallback(e,e.target||e.srcElement)){return}if(callback(e,combo)===false){Mousetrap._preventDefault(e);Mousetrap._stopPropagation(e)}};Mousetrap.prototype._handleKey=function(character,modifiers,e){var callbacks=this._getMatches(character,modifiers,e);var i;var doNotReset={};var maxLevel=0;var processedSequenceCallback=false;for(i=0;i<callbacks.length;++i){if(callbacks[i].seq){maxLevel=Math.max(maxLevel,callbacks[i].level)}}for(i=0;i<callbacks.length;++i){if(callbacks[i].seq){if(callbacks[i].level!==maxLevel){continue}processedSequenceCallback=true;doNotReset[callbacks[i].seq]=1;this._fireCallback(callbacks[i].callback,e,callbacks[i].combo);continue}if(!processedSequenceCallback){this._fireCallback(callbacks[i].callback,e,callbacks[i].combo)}}var ignoreThisKeypress=e.type==="keypress"&&this._ignoreNextKeypress;if(e.type===this._nextExpectedAction&&!Mousetrap._isModifier(character)&&!ignoreThisKeypress){this._resetSequences(doNotReset)}this._ignoreNextKeypress=processedSequenceCallback&&e.type==="keydown"};Mousetrap.prototype._handleKeyEvent=function(e){if(typeof e.which!=="number"){e.which=e.keyCode}var character=Mousetrap._characterFromEvent(e);if(!character){return}if(e.type==="keyup"&&this._ignoreNextKeyup===character){this._ignoreNextKeyup=false;return}this._handleKey(character,Mousetrap._eventModifiers(e),e)};Mousetrap.prototype._resetSequenceTimer=function(){clearTimeout(this._resetTimer);this._resetTimer=window.setTimeout(this._resetSequences,1e3)};Mousetrap.prototype._bindSequence=function(combo,keys,callback,action){var _this=this;this._sequenceLevels[combo]=0;var _increaseSequence=function(nextAction){return function(){_this._nextExpectedAction=nextAction;++_this._sequenceLevels[combo];_this._resetSequenceTimer();return}};var _callbackAndReset=function(e){_this._fireCallback(callback,e,combo);if(action!=="keyup"){_this._ignoreNextKeyup=Mousetrap._characterFromEvent(e)}window.setTimeout(_this._resetSequences,10);return};for(var i=0;i<keys.length;++i){var isFinal=i+1===keys.length;var wrappedCallback=isFinal?_callbackAndReset:_increaseSequence(action||Mousetrap._getKeyInfo(keys[i+1]).action);this._bindSingle(keys[i],wrappedCallback,action,combo,i)}};Mousetrap.prototype._bindSingle=function(combination,callback,action,sequenceName,level){this._directMap[combination+":"+action]=callback;combination=combination.replace(/\s+/g," ");var sequence=combination.split(" ");var info;if(sequence.length>1){this._bindSequence(combination,sequence,callback,action);return}info=Mousetrap._getKeyInfo(combination,action);this._callbacks[info.key]=this._callbacks[info.key]||[];this._getMatches(info.key,info.modifiers,{type:info.action},sequenceName,combination,level);this._callbacks[info.key][sequenceName?"unshift":"push"]({callback:callback,modifiers:info.modifiers,action:info.action,seq:sequenceName,level:level,combo:combination})};Mousetrap.prototype._bindMultiple=function(combinations,callback,action){for(var i=0;i<combinations.length;++i){this._bindSingle(combinations[i],callback,action)}};Mousetrap.prototype.bind=function(keys,callback,action){keys=Array.isArray(keys)?keys:[keys];this._bindMultiple(keys,callback,action)};Mousetrap.prototype.unbind=function(keys,action){var emptyFunc=function(){return};this.bind(keys,emptyFunc,action)};Mousetrap.prototype.trigger=function(keys,action){if(this._directMap[keys+":"+action]){this._directMap[keys+":"+action]({},keys)}};Mousetrap.prototype.reset=function(){this._callbacks={};this._directMap={}};Mousetrap.prototype.stopCallback=function(e,element){if((" "+element.className+" ").indexOf(" mousetrap ")>-1){return false}if(Mousetrap._belongsTo(element,this.target)){return false}return element.tagName==="INPUT"||element.tagName==="SELECT"||element.tagName==="TEXTAREA"||element.isContentEditable};Mousetrap.prototype.handleKey=function(){return this._handleKey(arguments)};Mousetrap._MAP={8:"backspace",9:"tab",13:"enter",16:"shift",17:"ctrl",18:"alt",20:"capslock",27:"esc",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",45:"ins",46:"del",91:"meta",93:"meta",224:"meta"};Mousetrap._KEYCODE_MAP={106:"*",107:"+",109:"-",110:".",111:"/",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"};Mousetrap._SHIFT_MAP={"~":"`","!":"1","@":"2","#":"3",$:"4","%":"5","^":"6","&":"7","*":"8","(":"9",")":"0",_:"-","+":"=",":":";",'"':"'","<":",",">":".","?":"/","|":"\\"};Mousetrap._SPECIAL_ALIASES={option:"alt",command:"meta",return:"enter",escape:"esc",plus:"+",mod:/Mac|iPod|iPhone|iPad/.test(navigator.platform)?"meta":"ctrl"};return Mousetrap}();exports.default=Mousetrap}])});