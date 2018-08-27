package project.travel_diary;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Created by maciejmarzeta on 17.05.2018.
 */

@PreAuthorize("hasRole('ROLE_MANAGER')")
public interface PlaceRepository extends CrudRepository<Place, Long>, PagingAndSortingRepository<Place, Long>{

    @Override
    @PreAuthorize("#place?.manager == null or #place?.manager?.name == authentication?.name")
    Place save(@Param("place") Place place);

    @Override
    @PreAuthorize("@placeRepository.findOne(#id)?.manager?.name == authentication?.name")
    void delete(@Param("id") Long id);

    @Override
    @PreAuthorize("#place?.manager?.name == authentication?.name")
    void delete(@Param("place") Place place);
}