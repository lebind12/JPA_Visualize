package com.portfolio.jpa.domain.order;

import com.portfolio.jpa.demo.persistence.OrderItemSummaryDto;
import com.portfolio.jpa.demo.persistence.OrderSummaryHead;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("select o.id from Order o order by o.id asc")
    List<Long> findFirst10OrderIds(Pageable pageable);

    @EntityGraph(attributePaths = {"member", "items", "items.product"})
    @Query("""
            select distinct o
            from Order o
            where o.id in :ids
            order by o.id asc
            """)
    List<Order> findAllWithGraphByIds(@Param("ids") List<Long> ids);

    @Query("""
            select distinct o
            from Order o
            join fetch o.items
            order by o.id asc
            """)
    List<Order> findAllFetchItems(Pageable pageable);

    @Query("""
            select new com.portfolio.jpa.demo.persistence.OrderSummaryHead(
                o.id, m.name
            )
            from Order o
            join o.member m
            where o.id = :orderId
            """)
    Optional<OrderSummaryHead> findSummaryHeadById(@Param("orderId") Long orderId);

    @Query("""
            select new com.portfolio.jpa.demo.persistence.OrderItemSummaryDto(
                p.id, p.name, oi.quantity, oi.unitPrice
            )
            from OrderItem oi
            join oi.product p
            where oi.order.id = :orderId
            """)
    List<OrderItemSummaryDto> findItemSummariesByOrderId(@Param("orderId") Long orderId);
}
