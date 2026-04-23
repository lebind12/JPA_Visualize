package com.portfolio.jpa.domain.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    long countByMemberId(long memberId);

    @Modifying
    @Query("delete from AuditLog a where a.memberId = :memberId")
    void deleteByMemberId(@Param("memberId") long memberId);
}
