from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class VaspRegistryEntry(BaseModel):
    """
    Represents an intelligence registry record for an on-chain address or entity cluster.
    Distinguishes the raw on-chain address from its potential VASP association.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    address: str = Field(..., description="On-chain address or cluster identifier")
    entity_name: str = Field(..., description="Descriptive entity label (e.g. Example Exchange Deposit Wallet)")
    entity_type: str = Field(..., description="Classification: DEPOSIT_WALLET, VASP, EXCHANGE, MIXER, etc.")
    vasp_name: str = Field(..., description="Associated Virtual Asset Service Provider brand/organization")
    source: str = Field(default="controlled_test_registry", description="Originating intelligence source")
    updated_at: str = Field(default="2026-09-08T00:00:00Z", description="ISO 8601 timestamp of last verification")
    reliability: str = Field(default="VERIFIED", description="Intelligence confidence tier (VERIFIED, PROVISIONAL, HEURISTIC)")
    cluster_id: Optional[str] = Field(default=None, description="Optional cluster identifier")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Inherent entity risk rating")
    tags: List[str] = Field(default_factory=list, description="Categorization tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary forensic notes and metadata")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "address": self.address.lower(),
            "entity_name": self.entity_name,
            "entity_type": self.entity_type,
            "vasp_name": self.vasp_name,
            "source": self.source,
            "updated_at": self.updated_at,
            "reliability": self.reliability,
            "cluster_id": self.cluster_id,
            "risk_score": self.risk_score,
            "tags": self.tags,
            "metadata": self.metadata,
        }


class VaspRegistry:
    """
    Authoritative VASP Registry abstraction for TRACEVAULT.
    Answers address attribution queries, entity type lookups, and source provenance.
    Maintains clean separation between raw addresses and potential VASP associations.
    """

    def __init__(self, entries: Optional[List[VaspRegistryEntry]] = None):
        self._entries: Dict[str, VaspRegistryEntry] = {}

        # Default controlled test intelligence baseline
        self._seed_default_entries()

        if entries:
            for entry in entries:
                self.register(entry)

    def _seed_default_entries(self) -> None:
        """Seed registry with controlled test intelligence entries."""
        defaults = [
            VaspRegistryEntry(
                address="EXCHANGE_DEPOSIT",
                entity_name="Example Exchange Deposit Wallet",
                entity_type="DEPOSIT_WALLET",
                vasp_name="Example Exchange",
                source="controlled_test_registry",
                updated_at="2026-09-08T00:00:00Z",
                reliability="VERIFIED",
                tags=["deposit_wallet", "exchange", "example_exchange"],
                metadata={"purpose": "User deposit forwarding", "jurisdiction": "Test Sandbox"},
            ),
            VaspRegistryEntry(
                address="0xEXCHANGE_DEPOSIT",
                entity_name="Example Exchange Deposit Wallet",
                entity_type="DEPOSIT_WALLET",
                vasp_name="Example Exchange",
                source="controlled_test_registry",
                updated_at="2026-09-08T00:00:00Z",
                reliability="VERIFIED",
                tags=["deposit_wallet", "exchange", "example_exchange"],
                metadata={"purpose": "User deposit forwarding", "jurisdiction": "Test Sandbox"},
            ),
            VaspRegistryEntry(
                address="MIXER_1",
                entity_name="Tornado Cash Mock",
                entity_type="MIXER",
                vasp_name="Tornado Cash Mock",
                source="controlled_test_registry",
                updated_at="2026-09-08T00:00:00Z",
                reliability="VERIFIED",
                risk_score=95.0,
                tags=["privacy_protocol", "mixer"],
                metadata={"note": "Anonymity pool protocol"},
            ),
        ]
        for entry in defaults:
            self.register(entry)

    def register(self, entry: VaspRegistryEntry) -> None:
        """Add or update a registry record (indexed case-insensitively)."""
        key = entry.address.strip().lower()
        self._entries[key] = entry

    def register_entity(
        self,
        address: str,
        entity_name: str,
        entity_type: str,
        vasp_name: str,
        source: str = "controlled_test_registry",
        updated_at: str = "2026-09-08T00:00:00Z",
        reliability: str = "VERIFIED",
        risk_score: float = 0.0,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> VaspRegistryEntry:
        """Helper to create and register an entry in one call."""
        entry = VaspRegistryEntry(
            address=address,
            entity_name=entity_name,
            entity_type=entity_type,
            vasp_name=vasp_name,
            source=source,
            updated_at=updated_at,
            reliability=reliability,
            risk_score=risk_score,
            tags=tags or [],
            metadata=metadata or {},
        )
        self.register(entry)
        return entry

    def lookup(self, address: str) -> Optional[VaspRegistryEntry]:
        """Lookup registry entry by address/identifier (case-insensitive)."""
        if not address:
            return None
        return self._entries.get(address.strip().lower())

    def is_known(self, address: str) -> bool:
        """Check if an address has a known attribution or tag in this registry."""
        return self.lookup(address) is not None

    def get_vasp_name(self, address: str) -> Optional[str]:
        """Return the associated VASP brand name if registered."""
        entry = self.lookup(address)
        return entry.vasp_name if entry else None

    def get_entity_type(self, address: str) -> Optional[str]:
        """Return the entity type classification if registered."""
        entry = self.lookup(address)
        return entry.entity_type if entry else None

    def get_all_entries(self) -> List[VaspRegistryEntry]:
        """Return all registered intelligence records."""
        return list(self._entries.values())

    def to_dict_map(self) -> Dict[str, Dict[str, Any]]:
        """
        Convert to adapter-compatible dictionary mapping:
        { "address": { "name": vasp_name, "type": entity_type, ... } }
        """
        result = {}
        for addr, entry in self._entries.items():
            result[addr] = {
                "name": entry.vasp_name,
                "entity_name": entry.entity_name,
                "type": entry.entity_type,
                "source": entry.source,
                "updated_at": entry.updated_at,
                "risk_score": entry.risk_score,
                "tags": entry.tags,
                "metadata": entry.metadata,
            }
        return result
