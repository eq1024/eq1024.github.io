---
title: "浏览器复制、剪切、粘贴事件简单操作示例"
date: 2022-02-26
description: "更多参考:点这里 复制、剪切、粘贴事件： copy 发生复制操作时触发; cut 发生剪切操作时触发; paste 发生粘贴操作时触发; 每个事件都有一个 before 事件对应：beforecopy、beforecut、beforepaste; 这几个 before 一般不怎么"
tags:
  - JavaScript
  - 浏览器
---

> 更多参考:[点这里](https://blog.csdn.net/fesfsefgs/article/details/111875639)

### 复制、剪切、粘贴事件：

- copy 发生复制操作时触发;
- cut 发生剪切操作时触发;
- paste 发生粘贴操作时触发;

每个事件都有一个 before 事件对应：`beforecopy、beforecut、beforepaste;`
这几个 before 一般不怎么用，所以我们把注意力放在三个事件就可以了。

### copy复制操作:

**copy事件使用示例：**

```html
<body>
	gggwgzgf
</body>
<script type="text/javascript">
	document.body.oncopy = e => {
	  // 监听全局复制 做点什么
	  console.log(e)
	};
</script>
```

<img src="https://gitee.com/zhouj889/pih/raw/master/NewPic/202202261713501.gif" alt="在这里插入图片描述" style="zoom:50%;" />

我们可以看到事件对象中的属性：

![在这里插入图片描述](https://gitee.com/zhouj889/pih/raw/master/NewPic/202202261715173.png)

我们主要研究的是里面的`clipboardData`属性对象

clipboardData 对象: 用于访问以及修改剪贴板中的数据
clipboardData对象中有两个方法：

**setData():**常配合copy事件使用，用于设置到剪贴板中的值

**getData():**常配合paste事件使用，用于获取设置到剪贴板中的值

> 不同浏览器，所属的对象不同：在 IE
> 中这个对象是window对象的属性，在Chrome、Safari和Firefox中，这个对象是相应的event对象的属性。所以我们在使用的时候，需要做一下如下兼容:

```javascript
document.body.oncopy = e => {
  let clipboardData = e.clipboardData || window.clipboardData;
  // 获取clipboardData对象 + do something
};
```

**copy配合getSelection实现复制某段文本**

```javascript
<body>
		gggwgzgf
	</body>
	<script type="text/javascript">
		document.body.oncopy = e => {
			console.log(window.getSelection().toString())
			let copyMsg = window.getSelection().toString()
			//把值设置到剪贴板中，方便paste事件触发去拿
			e.clipboardData.setData("Text", copyMsg);
		};
	</script>
```

<img src="https://gitee.com/zhouj889/pih/raw/master/NewPic/202202261717854.gif" alt="在这里插入图片描述" style="zoom:50%;" />

**注意：**`window.getSelection().toString()`我是调用`toString()`方法转成文本的，如果不调用这个方法，直接通过`window.getSelection()`取到值存到剪贴板会有出奇的效果，会连同效果一起粘贴(比如html格式的,会隐性地把`<body>`什么都复制进去)，需要配合paste事件

### paste粘贴事件

```html
<body>
		gggwgzgf
		<input placeholder="这里存放粘贴操作的值" />
	</body>
	<script type="text/javascript">
		document.body.oncopy = e => {
			console.log(window.getSelection().toString())
			let copyMsg = window.getSelection().toString()
			e.clipboardData.setData("Text", copyMsg);
		};
		
		document.body.onpaste=function(e){
				var data = e.clipboardData.getData("Text")
				document.querySelector("input").value = data
			}
	</script>
```

<img src="https://gitee.com/zhouj889/pih/raw/master/NewPic/202202261720978.gif" alt="在这里插入图片描述" style="zoom:50%;" />

**通过patse事件获取剪切板中的图片：**

```html
<script type="text/javascript">
		document.addEventListener('paste', function(event) {
			var items = (event.clipboardData && event.clipboardData.items) || [];
			var file = null;
			if(items && items.length) {
				for(var i = 0; i < items.length; i++) {
					if(items[i].type.indexOf('image') !== -1) {
						file = items[i].getAsFile();
						break;
					}
				}
			}
			console.log(file)
		});
</script>
```

**解释：** 当粘贴事件触发时遍历剪切版对象`（clipboardData）`中的所有`items`，找到类型为图片的`item`并调用`getAsFile`方法得到文件对象

**拿到`file` 对象后我们有几种选择：**

1. 通过`fileReader`得到文件对象的`base64`字符串

```javascript
var reader = new FileReader();
reader.onload = function(e){
// 通过e.target.result取到base64然后上传
// 作为src设到image标签上预览
}
reader.readAsDataURL(file); //此处的file为上面得到的文件对象```
```

2. 通过`formData`文件对象转换为二进制数据

```javascript
var formData = new FormData();
formData.append('file', file);
```

3. 通过 `URL.createObjectURL`转成url地址预览

```javascript
var blobUrl=URL.createObjectURL(file)
```

**示例代码：**

```html
<body>
		<img src="" id="imgTest" />
	</body>
	<script type="text/javascript">
		document.addEventListener('paste', function(event) {
			var items = (event.clipboardData && event.clipboardData.items) || [];
			var file = null;
			if(items && items.length) {
				for(var i = 0; i < items.length; i++) {
					if(items[i].type.indexOf('image') !== -1) {
						file = items[i].getAsFile();
						break;
					}
				}
			}
			var blobUrl = URL.createObjectURL(file);
			document.getElementById("imgTest").src = blobUrl;
		});
	</script>
```

<img src="https://gitee.com/zhouj889/pih/raw/master/NewPic/202202261722831.gif" alt="在这里插入图片描述" style="zoom:50%;" />

**局限性：**
`对于qq，微信等的截图或者按print screen得到的截图，还有任意网页的右击复制图片都能完美支持`，但是，对于电脑本地图片文件的复制没办法从剪切版获取到