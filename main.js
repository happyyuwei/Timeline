//DOM
let dom = window.document

//时间线
let timeline = [];

//角色, 记录角色的基本信息用于渲染
let role_list = [];


//将时间线上每个人的区域id与数据进行绑定，以便查询。
let id_detail_map = {};


//输入框
let name_input = dom.getElementById("name_input");
let time_input = dom.getElementById("time_input");
let detail_input = dom.getElementById("detail_input");
let warning_div = dom.getElementById("warning_div")


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
    time_input.value = "";
    detail_input.value = "";
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
let searchTimeline = (time) => {
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
let searchName = (nameArray, name) => {
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
    let point = searchTimeline(time);
    //该时间已经存在
    if (point !== null) {
        let name_detail = searchName(point.detailArray, name_input.value);
        if (name_detail != null) {
            name_detail.detail = detail_input.value;
        } else {
            point.detailArray.push(
                {
                    "name": name_input.value,
                    "detail": detail_input.value
                }
            )
        }
    } else {
        //时间点不存在则新增
        let point = {
            "time": time,
            "detailArray": [
                {
                    "name": name_input.value,
                    "detail": detail_input.value
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
    time_input.value = "";
    detail_input.value = "";

    // console.log(timeline);

    //绘制时间线
    visualTimeline();

    //保存时间线
    save();

};

/**
 * 渲染细节, 将出现过的名字高亮。
 */
let renderDetail = (detail) => {

    for (let i = 0; i < role_list.length; i++) {

        let name_html = "<span class='highlight'>" + role_list[i] + "</span>";
        detail = detail.replace(new RegExp(role_list[i], "gm"), name_html);
    }
    // console.log(detail);
    return detail;
};

/**
 * 创建一个时间点中的一个人的细节
 * @param time
 * @param nameDetail
 */
let createNameDetail = (time, nameDetail) => {

    let div = dom.createElement("div");

    for (let i = 0; i < nameDetail.length; i++) {
        let p = dom.createElement("p");
        //添加样式
        // p.setAttribute("style","padding: 100px")

        //名称
        let name_span = dom.createElement("span");
        //添加样式
        name_span.setAttribute("class", "name");
        name_span.innerText = nameDetail[i].name;

        //分割
        let split_span = dom.createElement("span");
        name_span.setAttribute("class", "name");
        split_span.innerText = "：";

        //细节
        let detail_span = dom.createElement("span");
        // detail_span.innerText = nameDetail[i].detail;
        detail_span.innerHTML = renderDetail(nameDetail[i].detail);
        // detail_span.innerHTML=nameDetail[i].detail;
        // 创建ID
        let detail_span_id = "detail_" + Math.random();
        detail_span.setAttribute("id", detail_span_id);
        detail_span.setAttribute("contenteditable", "true")
        //记录ID
        id_detail_map[detail_span_id] = {
            "time": time,
            "name": nameDetail[i].name,
            "detail": nameDetail[i].detail
        };

        //添加按键事件，按键完成将会在输入面板显示
        detail_span.addEventListener("click", (e) => {
            let detail_click = id_detail_map[e.target.id];
            // console.log(e);
            if (detail_click === undefined) {
                detail_click=id_detail_map[e.path[1].id];
            }
            console.log(detail_click);
            name_input.value = detail_click.name;
            time_input.value = detail_click.time;
            detail_input.value = detail_click.detail;
        });
        //时间线上可直接修改
        detail_span.addEventListener("keyup", (e) => {
            let modify = dom.getElementById(e.target.id).innerText;
            //获取修改的内容
            //面板上同步修改
            detail_input.value = modify;

            //在时间线上修改的内容可直接保存，无需任何按键
            //先获取所触发的时间-姓名-细节
            let detail_click = id_detail_map[e.target.id];
            //寻找保存到具体的内存中
            searchName(searchTimeline(parseTime(detail_click.time)).detailArray, detail_click.name).detail = modify;
            //保存时间线
            save();
        });

        //添加组件
        p.appendChild(name_span);
        p.appendChild(split_span);
        p.appendChild(detail_span);
        div.appendChild(p)
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

    let detail_p = createNameDetail(time_str, timePoint.detailArray);

    div.appendChild(time_h);
    div.appendChild(detail_p);

    list.appendChild(axis);
    list.appendChild(div);

    return list;
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
        let timepoint = createTimePoint(timeline[i]);
        timeline_ul.appendChild(timepoint);
    }
    timeline_container.appendChild(timeline_ul);
};

/**
 * APP入口方法
 */
let start = () => {

    //添加点击事件更新时间线
    let update_button = dom.getElementById("update_button");
    update_button.addEventListener("click", updateTimeline);

    //添加快捷键事件更新时间线
    document.addEventListener("keydown", (e) => {
        // 快捷键是alt+s
        if (e.altKey === true && e.key === "s") {
            //快捷键刷新时间线
            updateTimeline()
        } else if (e.altKey === true && e.key === "c") {
            //快捷键清空输入面板
            time_input.value = "";
            detail_input.value = "";
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
        alert("清除输入框：alt+c，更新时间线：alt+s。");
    });

    //载入保存的时间线
    if (load()) {
        //绘制时间线
        visualTimeline();
    }
};

//启动APP
start();

