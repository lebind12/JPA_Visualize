package com.portfolio.jpa.domain.order;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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
}
