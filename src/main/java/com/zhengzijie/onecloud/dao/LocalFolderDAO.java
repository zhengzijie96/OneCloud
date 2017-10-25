package com.zhengzijie.onecloud.dao;

import java.util.List;

import com.zhengzijie.onecloud.dao.entity.LocalFolderDO;

public interface LocalFolderDAO extends GenericDAO<LocalFolderDO> {
    List<LocalFolderDO> listByParent(long parent);
    List<LocalFolderDO> listByName(long userID, String name);
}