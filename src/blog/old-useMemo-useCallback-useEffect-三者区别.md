---
title: "useMemo, useCallback, useEffect 三者区别"
date: 2023-04-24
description: "useMemo 父组件将一个 【值】 传递给子组件，若父组件的其他值发生变化时，子组件也会跟着渲染多次，会造成性能浪费； useMemo是将父组件传递给子组件的值缓存起来，只有当 useMemo中的第二个参数状态变化时，子组件才重新渲染 useMemo便是用于缓存该函数的执行结果"
tags:
  - React
---

> useMemo

- 父组件将一个 `【值】 传递给子组件`，若父组件的其他值发生变化时，子组件也会跟着渲染多次，会造成性能浪费； useMemo是将父组件传递给`子组件的值缓存起来`，只有当 useMemo中的第二个参数状态变化时，子组件才重新渲染
- useMemo便是用于`缓存该函数的执行结果`，仅当依赖项改变后才会重新计算

```typescript
修改后如下，注意useMemo缓存的是函数执行的结果, 只有当[count, price]改变时才会重走一遍

const Parent = () => {
    const [count, setCount] = useState(0);
    const [color,setColor] = useState("");
    const [price,setPrice] = useState(10);
    const handleClick = () => {
        setCount(count + 1);
    }
    const getTotal = useMemo(()=>{
        console.log("getTotal exec ...") 
        return count * price
    },[count, price])
    
    return (<div>
        <div> <input onChange={(e) => setColor(e.target.value)}/></div>
        <div> <input value={price}  onChange={(e) => setPrice(Number(e.target.value))}/></div>
        <div> {count} <button onClick={handleClick}>+1</button></div>
        <div> {getTotal}</div>
    </div>)
}
```

> memo

- 父组件name属性或text属性变化都会导致Parent函数重新执行，所以即使传入子组件props没有任何变化，甚至子组件没有依赖于任何props属性，`都会导致子组件重新渲染`
- 使用memo包裹子组件时，`只有props发生改变子组件才会重新渲染`,以提升一定的性能

```pre
const Child = memo((props: any) => {
    console.log("子组件更新..."); // 只有当props属性改变，name属性改变时，子组件才会重新渲染
    return (
        <div>
            <h3>子组件</h3>
            <div>text:{props.name}</div>
            <div>{new Date().getTime()}</div>
        </div>
    )
})


const Parent = () => {
    const [text, setText] = useState("")
    …… ……
    <Child name ={text}/>
}

```

- 使用memoAPI来缓存组件

```pre
import React, { memo } from "react"
const CacheComponent = memo(() => {
  return <div> ^^ </div>  
})

```

> useCallback

- 父组件将一个`【方法】传递给子组件`，若父组件的其他状态发生变化时，子组件也会跟着`渲染多次`，会造成性能浪费； usecallback是将父组件传给`子组件的方法给缓存下来`，只有当 usecallback中的第二个参数状态变化时，子组件才`重新渲染`
- 但如果传入的props`包含函数`，父组件每次重新渲染`都是创建新的函数`，所以传递函数子组件还是会`重新渲染`，即使函数的内容还是一样，我们希望把`函数也缓存起来`，于是引入useCallback

```pre
const Child = memo((props: any) => {
    console.log("子组件更新..."); // 父级Parent函数有东西变化，Child重新执行，handleInputChange已经指向新的函数实例，所以子组件依然会刷新
    return (
        <div>
            <div>text:{props.name}</div>
            <div> <input onChange={props.handleInputChange} /></div>
        </div>
    )
})
const Parent = () => {
    const [text, setText] = useState("")
    const [count, setCount] = useState(0)
    const handleInputChange =useCallback((e) => {
         setText(e.target.value )
    },[]) 
    return (<div>
            …… ……
        <Child name={text} handleInputChange={handleInputChange}/>
    </div>)
}

```

- useCallback用用于缓存函数，只有当依赖项改变时，函数才会重新执行返回新的函数对于父组件中的函数作为props传递给子组件时，只要父组件数据改变，函数重新执行，`作为props的函数也会产生新的实例`，导致子组件的刷新使用useCallback可以缓存函数。`需要搭配memo使用`

```pre
1 - 在Parent组件里 handleInputChange用useCallback 包裹起来
2 - 当前 handleInputChange 不依赖与任何项，所以handleInputChange只在初始化的时候调用一次函数就被缓存起来

const handleInputChange =useCallback((e) => {
     setText(e.target.value )
},[]) 

3 - 将count加入到依赖项，count变化后重新生成新的函数，改变函数内部的count值
const handleInputChange =useCallback((e) => {
     setText(e.target.value )
},[count]) 

```

### useEffect 和 useMemo 区别

- useEffect是在`DOM改变之后触发`，useMemo在`DOM渲染之前就触发`
- useMemo是在`DOM更新前触发的`，就像官方所说的，类比生命周期就是[shouldComponentUpdate]
- useEffect可以帮助我们在`DOM更新完成后执行某些副作用操作`，如数据获取，设置订阅以及手动更改 React 组件中的 DOM 等
- 不要在这个useMemo函数内部`执行与渲染无关的操作`，诸如`副作用这类的操作属于 useEffect 的适用范畴`，而不是 useMemo
- 在useMemo中使用`setState你会发现会产生死循环`，并且会有警告，因为useMemo是`在渲染中进行的`，你在其中操作`DOM`后，又会导致触发`memo`

### useCallback 和 useMemo 区别

- 类似 `shouldComponentUpdate`， 判定该组件的 props 和 state 是否有变化，从而避免每次父组件render时都去重新渲染子组件
- `useCallback返回一个函数`，当把它返回的这个函数作为子组件使用时，可以避免每次父组件更新时都重新渲染这个子组件,子组件一般配合 `memo` 使用

```pre
const renderButton = useCallback(
     () => (
         <Button type="link">
            {buttonText}
         </Button>
     ),
     [buttonText]    // 当buttonText改变时才重新渲染renderButton
);

```

- `useMemo返回的的是一个值`，用于避免在每次渲染时都进行高开销的计算

```pre
const result = useMemo(() => {
    for (let i = 0; i < 100000; i++) {
      (num * Math.pow(2, 15)) / 9;
    }
}, [num]);

```

### 什么时候用useCallback和useMemo进行优化

链接 ：[技术来源程序员客栈的前端人](https://link.juejin.cn/?target=https%3A%2F%2Fjishuin.proginn.com%2Fp%2F763bfbd4ed55)

- 我觉得`任何时候都用是一个好的习惯`，就算有比对代价也比较小，因为哪怕是`对象也只是引用比较`
- React 的工作方式遵循纯函数，特别是数据的 `immutable`，因此，使用 memo 很重要