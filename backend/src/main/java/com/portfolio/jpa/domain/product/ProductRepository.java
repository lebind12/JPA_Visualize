package com.portfolio.jpa.domain.product;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("select p.id from Product p order by p.id asc")
    List<Long> findFirst20ProductIds(Pageable pageable);

    @Query("select p from Product p where p.id in :ids order by p.id asc")
    List<Product> findAllByIds(@Param("ids") List<Long> ids);
}
