//DOM
let dom = window.document

//时间线
let timeline = [];
/**
 * 时间线数据结构
 timeline:[
 {
        "time":20000,   //时间存储的是当天0点开始的分钟数。
        "nameArray":[    //一个时间下面会存在多个人的行动细节
            {
                "name":"" ,    //该细节的主角，
                "detailArray":[   //详细信息以字符串保存
                    "detail information", ...
                ],
                "visibleArray":[   //设置细节是否可见
                     true,
                     false,
                     ...
                ]
            },
            ...
        ]
    },
 ...
 ]
 */

//角色, 记录角色的基本信息用于渲染
let role_list = [];


//将时间线上每个人的区域id与数据进行绑定，以便查询。
let id_detail_map = {};


//输入框
let name_input = dom.getElementById("name_input");
let time_input = dom.getElementById("time_input");
let detail_input = dom.getElementById("detail_input");
let warning_div = dom.getElementById("warning_div");
//记住 选上是不可见
let invisible_checkbox = dom.getElementById("invisible_checkbox");
//开启将隐藏不可见细节
let invisible_render_switch = dom.getElementById("invisible_render_switch");

//是否处于编辑模式。在处于编辑模式下，可以直接修改时间线，但不能编辑左侧段落
//在非编辑模式下，id为null
let is_editable_mode = false;
let editing_id = null;


/**
 * 编辑模式下，左侧栏不能跟新，冻结输入框
 */
let editingMode = () => {
    if(is_editable_mode===false) {
        name_input.setAttribute("readonly", "readonly");
        time_input.setAttribute("readonly", "readonly");
        detail_input.setAttribute("readonly", "readonly");
        is_editable_mode = true;
    }
};

/**
 * 普通模式
 */
let normalMode = () => {

    if(is_editable_mode===true) {
        //清空面板
        clear_input();

        name_input.removeAttribute("readonly");
        time_input.removeAttribute("readonly");
        detail_input.removeAttribute("readonly");
        is_editable_mode = false;
        editing_id = null;
    }
};

/**
 * 保存时间线至本地
 */
let save = () => {
    //保存对象
    let save_obj = {
        "timeline": timeline,
        "roles": role_list
    };
    //保存至本地
    localStorage.setItem("mi-save", JSON.stringify(save_obj));
    // console.log("save");
};

/**
 * 载入,若成功载入则返回true.否则返回false.
 */
let load = () => {
    //载入
    let save_obj = JSON.parse(localStorage.getItem("mi-save"));
    // console.log(save_obj);

    if (save_obj !== null) {
        //保存至内存
        timeline = save_obj.timeline;
        role_list = save_obj.roles;
        return true;
    } else {
        return false;
    }
};

let clear_input = () => {
    time_input.value = "";
    detail_input.value = "";
    invisible_checkbox.checked = false;
    //聚焦在时间输入框
    time_input.focus();
    time_input.select();
};
/**
 * 清空过去的时间线
 */
let clear = () => {
    //清除本地缓存
    localStorage.removeItem("mi-save");
    //清空内存
    timeline = [];
    role_list = [];
    //重绘
    visualTimeline();

    //刷新面板
    name_input.value = "";
    clear_input();

};

/**
 * 解析时间，将20:20分解析成从0点开始的分钟
 * @param str
 */
let parseTime = (str) => {
    let str_array = str.split(":");
    return parseInt(str_array[0] * 60 + parseInt(str_array[1]));
};

/**
 *
 * @param time
 * @returns {string}
 */
let formatTime = (time) => {
    let hour = parseInt(time / 60);
    let minute = time - 60 * hour;

    if (minute <= 9) {
        minute = "0" + minute;
    }

    if (hour <= 9) {
        hour = "0" + hour;
    }

    return hour + " : " + minute;
};

/**
 * 检查时间是否合理
 * @param time_str
 */
let checkTime = (time_str) => {

    let str_array = time_str.split(":");
    if (str_array.length === 1) {
        return false;
    }

    if (time_str.includes("NaN")) {
        return false
    }

    let hour = parseInt(str_array[0]);
    let minute = parseInt(str_array[1]);

    if (hour > 24 || hour < 0) {
        return false;
    }

    return !(minute > 60 || minute < 0);
};

/**
 *
 * @param time
 * @returns {*}
 */
let searchInTimeline = (time) => {
    for (let i = 0; i < timeline.length; i++) {
        if (timeline[i].time === time) {
            return timeline[i];
        }
    }
    return null;
};


/**
 * 搜索名字
 * @param nameArray
 * @param name
 * @returns {*}
 */
let searchInNameArray = (nameArray, name) => {
    for (let i = 0; i < nameArray.length; i++) {
        if (nameArray[i].name === name) {
            return nameArray[i];
        }
    }
    return null;
};


let checkInput = () => {
    //去除空格
    name_input.value = name_input.value.replace(/ /g, "");
    time_input.value = time_input.value.replace(/ /g, "");

    //输入框没有输入
    if (name_input.value === "") {
        warning_div.innerText = "尚未输入角色名！";
        //清空警告区域
        warning_div.style.visibility = "visible";
        return false;
    } else if (time_input.value === "") {
        warning_div.innerText = "尚未输入时间！";
        //清空警告区域
        warning_div.style.visibility = "visible";
        return false;
    }

    //检查时间格式
    if (checkTime(time_input.value) === false) {
        warning_div.innerText = "输入时间无法识别！";
        //清空警告区域
        warning_div.style.visibility = "visible";
        return false;
    }

    warning_div.innerText = "无警告！";
    //清空警告区域
    warning_div.style.visibility = "hidden";
    return true;

};

/**
 * 更新时间线方法
 */
let updateTimeline = () => {
    //如果输入姓名与时间不完整，则不会刷新时间线
    if (checkInput() === false) {
        return;
    }

    //将姓名记录下来
    if (role_list.includes(name_input.value) === false) {
        role_list.push(name_input.value);
    }

    //添加至时间线
    let time = parseTime(time_input.value);
    let point = searchInTimeline(time);
    //该时间已经存在
    if (point !== null) {
        let name_detail = searchInNameArray(point.nameArray, name_input.value);
        //该用户有记录
        if (name_detail != null) {
            name_detail.detailArray.push(detail_input.value);
        } else {
            //该用户无记录
            point.nameArray.push(
                {
                    "name": name_input.value,
                    "detailArray": [detail_input.value],
                    "visibleArray": [!invisible_checkbox.checked]
                }
            )
        }
    } else {
        //时间点不存在则新增
        let point = {
            "time": time,
            "nameArray": [
                {
                    "name": name_input.value,
                    "detailArray": [detail_input.value],
                    "visibleArray": [!invisible_checkbox.checked]
                }
            ]
        };
        timeline.push(point);
    }

    //排序时间线
    timeline.sort((a, b) => {
        if (a.time < b.time) {
            return -1;
        } else {
            return 1;
        }
    });

    //刷新面板
    clear_input();

    console.log(timeline);

    // 绘制时间线
    visualTimeline();

    // 保存时间线
    save();

};

/**
 * 渲染细节, 将出现过的名字高亮。
 */
let renderDetail = (detail) => {

    //去除所有换行符
    // detail=detail.replace(/\s+/g,"。");

    //高亮所有人物姓名
    for (let i = 0; i < role_list.length; i++) {

        let name_html = "<span class='highlight'>" + role_list[i] + "</span>";
        detail = detail.replace(new RegExp(role_list[i], "gm"), name_html);
    }

    //将多个逗号替换成一个
    // detail=detail.replace(new RegExp("，+","gm"),"，");
    // detail=detail.replace(new RegExp("。+","gm"),"。");
    // detail=detail.replace(new RegExp("；+","gm"),"；");
    //
    // console.log(detail);
    return detail;
};


/**
 * 创建一个时间点中的一个人的细节
 * @param time_str
 * @param nameArray
 */
let createNameArray = (time_str, nameArray) => {

    let div = dom.createElement("div");

    for (let i = 0; i < nameArray.length; i++) {

        //查看一个名字下是否全是不可见，如果是，则名字不必渲染。
        let bool = nameArray[i].visibleArray.reduce((total, current) => {
            return total || current;
        });

        if (invisible_render_switch.checked === false || bool === true) {

            let p = dom.createElement("p");
            //添加样式
            // p.setAttribute("style","padding: 100px")

            //名称
            let name_span = dom.createElement("span");
            //添加样式
            name_span.setAttribute("class", "name");
            name_span.innerText = nameArray[i].name;

            //分割
            let split_span = dom.createElement("span");
            name_span.setAttribute("class", "name");
            split_span.innerText = "：";

            //添加组件
            p.appendChild(name_span);
            p.appendChild(split_span);

            //===============================================================================
            //细节
            for (let j = 0; j < nameArray[i].detailArray.length; j++) {

                if (nameArray[i].visibleArray[j] === true || invisible_render_switch.checked === false) {

                    let detail_span = dom.createElement("span");
                    detail_span.innerHTML = renderDetail(nameArray[i].detailArray[j]);

                    // 创建ID
                    let detail_span_id = "detail_" + Math.random();
                    detail_span.setAttribute("id", detail_span_id);
                    detail_span.setAttribute("contenteditable", "true");
                    detail_span.setAttribute("class", "edit-paragraph");

                    //记录ID
                    id_detail_map[detail_span_id] = {
                        "time": time_str,
                        "name": nameArray[i].name,
                        "detail": nameArray[i].detailArray[j],
                        "id": j,    //id为对应detailArray中的第几条细节。
                        "visible": nameArray[i].visibleArray[j],
                    };

                    //修改完成失去焦距即重新渲染
                    detail_span.addEventListener("blur", (e) => {
                        //修改时当场渲染
                        //添加
                        e.target.innerHTML = renderDetail(e.target.innerText);
                    });

                    detail_span.addEventListener("focus", (e) => {
                        //获取修改权限，冻结左侧窗口。
                        editingMode();
                        //记录编辑模式下允许编辑的组件
                        editing_id = e.target.id;
                    });

                    //添加按键事件，按键完成将会在输入面板显示
                    detail_span.addEventListener("click", (e) => {
                        let detail_click = id_detail_map[e.target.id];
                        // console.log(e);
                        if (detail_click === undefined) {
                            detail_click = id_detail_map[e.path[1].id];
                        }
                        // console.log(detail_click);
                        name_input.value = detail_click.name;
                        time_input.value = detail_click.time;
                        detail_input.value = detail_click.detail;
                        // console.log(detail_click.visible);
                        invisible_checkbox.checked = !detail_click.visible;
                    });
                    //时间线上可直接修改
                    detail_span.addEventListener("keyup", (e) => {
                        // let modify = dom.getElementById(e.target.id).innerText;
                        let modify = e.target.innerText;
                        //获取修改的内容
                        //面板上同步修改
                        detail_input.value = modify;

                        //在时间线上修改的内容可直接保存，无需任何按键
                        //先获取所触发的时间-姓名-细节
                        let detail_click = id_detail_map[e.target.id];
                        //寻找保存到具体的内存中
                        searchInNameArray(searchInTimeline(parseTime(detail_click.time)).nameArray, detail_click.name).detailArray[detail_click.id] = modify;

                        //保存到映射缓存中
                        detail_click.detail = modify;

                        //保存时间线
                        save();

                    });
                    //追加细节
                    p.appendChild(detail_span);
                }
            }


            //追加段落
            div.appendChild(p)
        }
    }

    return div
};

/**
 * 创建时间线中的一个时间点视图
 * @param timePoint
 * @returns {HTMLElement}
 */
let createTimePoint = (timePoint) => {
    let list = dom.createElement("li");
    list.setAttribute("class", "layui-timeline-item");

    let axis = dom.createElement("div");
    axis.setAttribute("class", "layui-icon layui-timeline-axis");
    //参考文档，这里有个类似于口的正方形的，这里显示不出来。
    axis.innerText = "";

    let div = dom.createElement("div");
    div.setAttribute("class", "layui-timeline-content layui-text");

    let time_h = dom.createElement("h3");
    time_h.setAttribute("class", "layui-timeline-title");
    let time_str = formatTime(timePoint.time);
    time_h.innerText = time_str;

    let detail_p = createNameArray(time_str, timePoint.nameArray);

    div.appendChild(time_h);
    div.appendChild(detail_p);

    list.appendChild(axis);
    list.appendChild(div);

    return list;
};

/**
 * 检查时间点里是否全是不可见
 * @param timePoint
 */
let checkInvisibleInTimePoint = (timePoint) => {

    for (let i = 0; i < timePoint.nameArray.length; i++) {
        let bool = timePoint.nameArray[i].visibleArray.reduce((total, current) => {
            return total || current;
        });
        if (bool === true) {
            return true
        }
    }
    return false;
};

/**
 * 绘制时间线
 */
let visualTimeline = () => {
    //情况缓存
    id_detail_map = {};

    //获取时间线
    let timeline_container = dom.getElementById("timeline-container");

    let timeline_ul = dom.getElementById("timeline");

    if (timeline_ul !== null) {
        //清空时间线并重绘
        timeline_container.removeChild(timeline_ul);
    }

    timeline_ul = dom.createElement("ul");
    timeline_ul.setAttribute("class", "layui-timeline");
    timeline_ul.setAttribute("id", "timeline");
    //时间线
    for (let i = 0; i < timeline.length; i++) {
        let timePoint = createTimePoint(timeline[i]);

        //检查是否全为不可见，如果全不可见，则该时间线不显示。
        let bool = checkInvisibleInTimePoint(timeline[i]);
        if (invisible_render_switch.checked === false || bool === true) {
            timeline_ul.appendChild(timePoint);
        }
    }
    timeline_container.appendChild(timeline_ul);
};

/**
 * APP入口方法
 */
let start = () => {

    //添加点击事件更新时间线
    let update_button = dom.getElementById("update_button");
    update_button.addEventListener("click", () => {
        if (is_editable_mode === false) {
            updateTimeline();
        }
    });

    //添加快捷键事件更新时间线
    document.addEventListener("keydown", (e) => {
        // 快捷键是alt+s
        if (e.altKey === true && e.key === "s") {
            //快捷键刷新时间线
            //编辑模式下会自动刷新，不允许手动刷新
            if (is_editable_mode === false) {
                updateTimeline();
            }
        } else if (e.altKey === true && e.key === "c") {
            //快捷键清空输入面板
            clear_input();
        }
    });

    //添加时间输入整理事件
    // let time_input = dom.getElementById("time_input");
    time_input.addEventListener("change", () => {
        // 将输入的时间转成指定格式
        let value = time_input.value;
        //支持将分-秒，分：秒 格式的时间同意转换成 分:秒
        value = value.replace("-", ":").replace("：", ":");
        //去掉空格
        value = value.replace(/ /g, "");

        if (value !== "") {

            let time_array = value.split(":");

            let hour = parseInt(time_array[0]);
            let minute = parseInt(time_array[1]);
            //如果单个数组前面加0
            if (minute <= 9) {
                minute = "0" + minute;
            }
            if (hour <= 9) {
                hour = "0" + hour;
            }
            time_input.value = hour + ":" + minute;
        }
    });

    //添加新建事件
    dom.getElementById("new").addEventListener("click", () => {
        if (confirm("新建时间线将删除历史时间线，是否继续？")) {
            //重绘
            clear();
        }
    });

    //添加帮助事件
    dom.getElementById("help").addEventListener("click", () => {
        alert("清除输入框：alt+c，更新时间线：alt+s。可以直接在生成的时间线上修改内容。");
    });

    //添加渲染选择事件
    dom.getElementById("invisible_render_switch_div").addEventListener("click", () => {
        //重新绘制时间线
        visualTimeline();
        //刷新面板
        clear_input();
    });

    //添加编辑模式下，checkbox自动保存事件
    invisible_checkbox.addEventListener("click", () => {

        //在编辑模式下自动保存
        if (editing_id !== null) {

            //更新时间线
            let detail_click = id_detail_map[editing_id];
            searchInNameArray(searchInTimeline(parseTime(detail_click.time)).nameArray, detail_click.name).visibleArray[detail_click.id] = !invisible_checkbox.checked;

            //跟新id缓存
            detail_click.visible = !invisible_checkbox.checked;
        }
    });

    //添加普通模式触发事件
    name_input.addEventListener("click", normalMode);
    time_input.addEventListener("click", normalMode);
    detail_input.addEventListener("click", normalMode);

    //载入保存的时间线
    if (load()) {
        //绘制时间线
        visualTimeline();
    }
};

//启动APP
start();

