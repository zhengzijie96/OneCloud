package com.zhengzijie.onecloud.web;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.alibaba.fastjson.JSONObject;
import com.zhengzijie.onecloud.manager.util.JSONUtil;
import com.zhengzijie.onecloud.service.MoveService;
import com.zhengzijie.onecloud.service.factory.MoveServiceFactory;

@WebServlet("/MoveServlet")
public class MoveServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
	    doPost(request, response);
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
	    JSONObject reqJSON = JSONUtil.getJSONObject(request.getReader());
	    
	    long id = reqJSON.getLongValue("id");
	    String type = reqJSON.getString("type");
	    long moveTo = reqJSON.getLongValue("moveTo");
	    
	    MoveService moveService = MoveServiceFactory.getService(type);
	    JSONObject respJSON = moveService.serve(id, moveTo);
	    
	    response.setContentType("application/json;charset=utf-8");
        PrintWriter writer = response.getWriter();
        writer.write(respJSON.toJSONString());
        writer.close();
	}

}