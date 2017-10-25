var menu = new BootstrapMenu(".disk-item", {
    actionsGroups: [
        ["download", "moveTo", "rename"],
        ["moveToSafe"],
        ["remove"]
    ],
    actions: {
        share: {
            name: "分享",
            iconClass: "fa-share-alt",
            classNames: "right-click-menu",// 自定义的样式
            onClick: function() {
                alert("分享");
            },
        },
        download: {
            name: "下载",
            iconClass: "fa-cloud-download",
            classNames: "right-click-menu",
            onClick: download,
        },
        moveTo: {
            name: "移动到",
            classNames: "right-click-menu",
            onClick: moveTo,
        },
        rename: {
            name: "重命名",
            classNames: "right-click-menu",
            onClick: rename,
        },
        moveToSafe: {
            name: "移至保险箱",
            iconClass: "fa-shield",
            classNames: "right-click-menu",
            onClick: function() {
                alert("移至保险箱");
            },
        },
        remove: {
            name: "删除",
            iconClass: "fa-trash",
            classNames: "right-click-menu",
            onClick: remove,
        }
    }
});
function multiple() {
    var isMultiple = getSelectedItems().length != 1;
    return isMultiple;   
}


/* 获取被选中的节点 */
function getSelectedItems() {
    var selectedItem = $(".selected");
    return selectedItem;
}


/*------------------------------------------------- 重命名功能 -------------------------------------------------*/


function rename() {
    var selectedItem = getSelectedItems();
    if (selectedItem.find(".fileedit").length == 0) {// 防止插入多个文件名编辑框
        var originalNameTag = selectedItem.find(".file-name");
        originalNameTag.parent().hide();// hide .file-title
        /* 插入一个文件名编辑框 */
        var fileedit = $('<span class="fileedit"><input type="text" /></span>');
        fileedit.find("input").val(originalNameTag.text());
        fileedit.find("input").blur(confirmEditName);// 输入框失去焦点时即确认
        fileedit.find("input").keydown(confirmEditNameByKeyboard);// 按下回车键即确认
        fileedit.click(function(e){e.stopPropagation()});// 阻止冒泡，不触发上一级的单击事件

        fileedit.appendTo(selectedItem.find(".file-head"));
        fileedit.find("input").focus();
    } else {// 如果文件名编辑框已存在，focus
        selectedItem.find(".fileedit input").focus();
    }
}
/* 按下回车键后，使输入框失去焦点 */
function confirmEditNameByKeyboard(event) {
    if (event.keyCode == 13) {
        $(this).blur();
    }
}
/* 确认重命名，当输入框失去焦点后触发的事件处理函数 */
function confirmEditName() {
    var inputTag = $(this);
    var itemTag = inputTag.parent().parent().parent();
    var nameTag = inputTag.parent().prev().find(".file-name");
    var originalName = nameTag.text();
    var newName = inputTag.val();


    /* 需要交给服务器的数据 */
    var id;
    var localName;
    var localType = null;
    var type;
    if (itemTag.attr("data-folder-id") != undefined) {
        type = "folder";
        id = itemTag.attr("data-folder-id");
        localName = newName;
    } else {
        type = "file";
        id = itemTag.attr("data-file-id");
        localName = getFilenameWithoutSuffix(newName);
        localType = getSuffix(newName);
    }
    var renameData = {
        id: id,
        localName: localName,
        localType: localType,
        type: type
    };


    if (newName.length ==0) {
        // TO DO 判断是否全为空格
        alert("名字不能为空");
    } else if (originalName == newName) {
        // Do nothing
    } else if (checkDuplicateName(itemTag, newName)) {
        alert("文件名产生冲突");
    } else if (originalName != newName) {
        $.ajax({
            type: "POST",
            url: "RequestManageServlet?action=rename",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(renameData),
            success: function(result) {
                if (result.status == 1) {
                    nameTag.text(newName);
                    itemTag.find(".file-time").text(getFormattedDateTime(result.ldtModified));
                    if (localType != null) {
                        var src = getFileIcon(localType);
                        itemTag.find(".thumb img").attr("src", src);
                    }
                } else {
                    alert("重命名失败！");
                }
            }
        });
    }
    /* 移除文件名编辑框 */
    inputTag.parent().remove();

    nameTag.parent().show();
}
/*
 * 检查修改后的文件名是否与当前文件夹下的其它文件名产生冲突
 * return true if 产生冲突；eles return false；
 */
function checkDuplicateName(itemTag, newName) {
    var siblingTags = itemTag.siblings();
    var isDuplicate = false;
    siblingTags.each(function() {
        if ($(this).find(".file-name").text() == newName) {
            isDuplicate = true;
        }
    });
    return isDuplicate;
}

/************************************* 删除 *************************************/
function remove() {
    var selectedItem = getSelectedItems();
    selectedItem.each(function() {
        var itemTag = $(this);
        /* 需要提交的数据 */
        var id;
        var type;
        if (itemTag.attr("data-folder-id") != undefined) {
            id = itemTag.attr("data-folder-id");
            type = "folder";
        } else {
            id = itemTag.attr("data-file-id");
            type = "file";
        }
        var moveData = {
            id: id,
            type: type,
            moveTo: 3
        };

        $.ajax({
            type: "POST",
            url: "RequestManageServlet?action=move",
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify(moveData),
            success: function(result){
                if (result.status == 1) {
                    /* 隐藏模态框中的文件夹节点 */
                    if (type == "folder") {
                        $('.treeNode-info[data-folder-id="' + id + '"]' ).parent().hide();
                        /* 重置选择路径 */
                        $("#dirbox_path").attr("data-folder-id", 1).text("我的网盘");
                    }

                    itemTag.removeClass("disk-item");
                    itemTag.addClass("recycle-item");
                    itemTag.find(".file-time").text(getRemainDays(result.ldtModified));
                    itemTag.appendTo($("#recycle_folder"));
                } else {
                    alert("删除失败");
                }
            }
        });
    });
}
function getRemainDays(date) {
    var gapDays = getGapDays(date);
    var str = "剩余" + (7 - gapDays) + "天";
    return str;
}

function moveTo() {
    $("#dirbox_header_action").text("移动");
    $("#modal_btn_submit").text("移动");


    var selectedItems = getSelectedItems();

    var firstFilename = selectedItems.eq(0).find(".file-name").text();
    var nums = selectedItems.length;
    var src;
    if (selectedItems.eq(0).attr("data-folder-id") != undefined) {
        src = "img/icon/folder.png";
    } else {
        src = getFileIcon(getSuffix(firstFilename));
    }
    /* 显示要移动的文件信息和数量 */
    $("#modal_file_thumb").attr("src", src);
    $("#modal_file_name").text(firstFilename);
    if (nums == 1) {
        $("#modal_addtional_info").hide();
    } else {
        $("#modal_addtional_info span").text(nums);
        $("#modal_addtional_info").show();
    }

    $("#path_modal").modal("show");

    $("#modal_btn_cancel").click(removeAddedMission);
    $("#modal_btn_close").click(removeAddedMission);
    $("#modal_btn_submit").click(moveStart);


    function moveStart() {
        var newParent = $("#dirbox_path").attr("data-folder-id");

        /* 检查路径是否合法 */
        var isLegal = true;
        selectedItems.each(function() {
            if ($(this).attr("data-folder-id") != undefined) {
                var id = $(this).attr("data-folder-id");
                if (id == newParent) {// 检查是否移动到自身
                    isLegal = false;
                    return false;// 结束循环
                }
                var sub = $('.treeNode-info[data-folder-id="' + id + '"]').next().find(".treeNode-info");
                sub.each(function(){// 检查是否移动到自身的子文件夹
                    if ($(this).attr("data-folder-id") == newParent) {
                        isLegal = false;
                        return false;// 结束循环
                    }
                });
            }
        });
        if (!isLegal) {
            alert("不能移动文件夹到自身及其子文件夹下");
            return;
        }

        /* 检查文件是否已经在该路径下 */
        // TODO


        $("#path_modal").modal("hide");
        /* 开始移动 */
        selectedItems.each(function() {
            var itemTag = $(this);
            /* 需要提交的数据 */
            var id;
            var type;
            if (itemTag.attr("data-folder-id") != undefined) {
                id = itemTag.attr("data-folder-id");
                type = "folder";
            } else {
                id = itemTag.attr("data-file-id");
                type = "file";
            }
            var moveData = {
                id: id,
                type: type,
                moveTo: newParent
            };

            $.ajax({
                type: "POST",
                url: "RequestManageServlet?action=move",
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify(moveData),
                success: function(result) {
                    if (result.status == 1) {
                        /* 移动模态框中的文件夹节点 */
                        if (type == "folder") {
                            var newParentDir = $('.treeNode-info[data-folder-id="' + newParent + '"]' );
                            /* 注意设置padding */
                            var paddingParam = parseInt(newParentDir.css("padding-left"), 10) + 20 + "px";
                            var moveDir = $('.treeNode-info[data-folder-id="' + id + '"]');
                            var paddingBefore = parseInt(moveDir.css("padding-left"));
                            moveDir.css("padding-left", paddingParam);
                            var paddingAfter = parseInt(moveDir.css("padding-left"));
                            var paddingAdjustment = paddingAfter - paddingBefore; 
                            var moveSubDirs = moveDir.next().find(".treeNode-info");
                            moveSubDirs.each(function(){
                                var paddingParam = parseInt($(this).css("padding-left"), 10) + paddingAdjustment + "px";
                                $(this).css("padding-left", paddingParam);
                            })

                            moveDir.parent().appendTo(newParentDir.next());
                        }

                        itemTag.find(".file-time").text(getFormattedDateTime(result.ldtModified));
                        itemTag.appendTo($('ul[data-folder-id="' + newParent + '"]'));
                    } else {
                        alert("移动失败");
                    }
                }
            });
        });

        $("#modal_btn_submit").off("click");

    }

}

/************************************* 下载 *************************************/
function download() {
    var selectedItems = getSelectedItems();

    var dataArr = new Array();
    selectedItems.each(function(index) {
        var itemTag = $(this);
        /* 需要提交的数据 */
        var id;
        var type;
        if (itemTag.attr("data-folder-id") != undefined) {
            id = itemTag.attr("data-folder-id");
            type = 0;// folder
        } else {
            id = itemTag.attr("data-file-id");
            type = 1;// file
        }
        dataArr[index] = {
            id: id,
            t: type
        };
    });
    window.location.href = "RequestManageServlet?action=download&dl=" + encodeURIComponent(JSON.stringify(dataArr));
}