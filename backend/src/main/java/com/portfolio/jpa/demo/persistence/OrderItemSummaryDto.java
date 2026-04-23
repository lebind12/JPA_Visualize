package com.portfolio.jpa.demo.persistence;

public record OrderItemSummaryDto(Long productId, String productName, int quantity, int unitPrice) {}
