package com.portfolio.jpa.demo.persistence;

import java.util.List;

public record OrderSummaryDto(Long orderId, String memberName, int itemCount, List<OrderItemSummaryDto> items) {}
